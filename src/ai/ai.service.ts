import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { genkit, Genkit, ToolAction, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { retry } from '@genkit-ai/middleware';
import {
  weatherInputSchema,
  weatherOutputSchema,
  getWeatherHandler,
  GET_WEATHER_TOOL_NAME,
  GET_WEATHER_TOOL_DESCRIPTION,
} from './tools/get-weather.tool';
import {
  getUsersInputSchema,
  getUsersOutputSchema,
  GET_USERS_TOOL_NAME,
  GET_USERS_TOOL_DESCRIPTION,
} from './tools/get-users.tool';
import { UsersService } from '../users/users.service';
import { HydratedDocument } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Role } from '../users/enums/role.enum';

@Injectable()
export class AiService {
  private readonly ai: Genkit;
  private weatherTool: ToolAction<
    typeof weatherInputSchema,
    typeof weatherOutputSchema
  >;
  private usersTool: ToolAction<
    typeof getUsersInputSchema,
    typeof getUsersOutputSchema
  >;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const apiKey = this.configService.getOrThrow<string>(
      'GOOGLE_GENAI_API_KEY',
    );
    this.ai = genkit({ plugins: [googleAI({ apiKey }), retry.plugin()] });

    this.weatherTool = this.ai.defineTool(
      {
        name: GET_WEATHER_TOOL_NAME,
        description: GET_WEATHER_TOOL_DESCRIPTION,
        inputSchema: weatherInputSchema,
        outputSchema: weatherOutputSchema,
      },
      getWeatherHandler,
    );

    this.usersTool = this.ai.defineTool(
      {
        name: GET_USERS_TOOL_NAME,
        description: GET_USERS_TOOL_DESCRIPTION,
        inputSchema: getUsersInputSchema,
        outputSchema: getUsersOutputSchema,
      },
      async () => {
        const users = await this.usersService.getAllUsers();
        return users.map((u) => ({
          id: (u as HydratedDocument<User>)._id.toString(),
          username: u.username,
          email: u.email,
          role: u.role,
          ...(u.displayName && { displayName: u.displayName }),
          ...(u.avatarUrl && { avatarUrl: u.avatarUrl }),
        }));
      },
    );
  }

  private async runGenerate(prompt: string, role: Role): Promise<string> {
    const isAdmin = ([Role.Admin] as Role[]).includes(role);
    const tools: ToolAction<any, any>[] = [this.weatherTool];
    if (isAdmin) {
      tools.push(this.usersTool);
    }

    const system = isAdmin
      ? undefined
      : 'If the user asks about users, user lists, user data, or anything related to application user management, respond with exactly: "I do not have access to your internal databases, server, or application user management system."';

    const intentResponse = await this.ai.generate({
      model: googleAI.model('gemma-4-26b-a4b-it'),
      prompt: `Classify the user's query as either a 'text' or a 'image' request. Query: "${prompt}"`,
      output: {
        schema: z.object({
          intent: z.enum(['text', 'image']),
        }),
      },
    });

    const intent = intentResponse.output?.intent;

    console.log('intend: ', intent);

    if (intent === 'text') {
      const { text } = await this.ai.generate({
        model: googleAI.model('gemma-4-26b-a4b-it'),
        system,
        prompt,
        tools,
      });
      return text;
    } else if (intent === 'image') {
      const imageResponse = await this.ai.generate({
        model: googleAI.model('gemini-2.5-flash-image'),
        prompt: prompt,
        output: { format: 'media' },
      });
      const imageUrl = imageResponse.media?.url;

      if (!imageUrl) {
        throw new Error('Failed to generate an image.');
      }
      return imageUrl;
    } else {
      return "Sorry, I couldn't determine how to handle your request.";
    }
  }

  async generate(prompt: string, role: Role): Promise<string> {
    console.log(`Received prompt: ${prompt}`);
    return this.runGenerate(prompt, role);
  }
}

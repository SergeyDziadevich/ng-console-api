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

@Injectable()
export class AiService {
  private readonly ai: Genkit;
  private weatherTool: ToolAction<
    typeof weatherInputSchema,
    typeof weatherOutputSchema
  >;

  constructor(private readonly configService: ConfigService) {
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
    this.registerFlows();
  }

  private registerFlows(): void {
    this.ai.defineFlow(
      {
        name: 'generateFlow',
        inputSchema: z.string(),
        outputSchema: z.string(),
      },
      async (prompt: string) => this.runGenerate(prompt),
    );
  }

  private async runGenerate(prompt: string): Promise<string> {
    const { text } = await this.ai.generate({
      model: googleAI.model('googleai/gemini-3.1-flash-lite'),
      prompt,
      tools: [this.weatherTool],
    });
    return text;
  }

  async generate(prompt: string): Promise<string> {
    console.log(`Received prompt: ${prompt}`);
    return this.runGenerate(prompt);
  }
}

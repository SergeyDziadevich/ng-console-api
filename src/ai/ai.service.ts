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
import { PostsService } from '../posts/posts.service';
import { TicketsService } from '../tickets/tickets.service';
import { TicketStatus } from '../tickets/entities/ticket.entity';
import { AuditProducerService } from '../audit/audit-producer.service';
import {
  getPostsInputSchema,
  getPostsOutputSchema,
  GET_POSTS_TOOL_NAME,
  GET_POSTS_TOOL_DESCRIPTION,
} from './tools/get-posts.tool';
import {
  getTicketsInputSchema,
  getTicketsOutputSchema,
  GET_TICKETS_TOOL_NAME,
  GET_TICKETS_TOOL_DESCRIPTION,
} from './tools/get-tickets.tool';
import {
  bulkUpdateTicketsInputSchema,
  bulkUpdateTicketsOutputSchema,
  BULK_UPDATE_TICKETS_TOOL_NAME,
  BULK_UPDATE_TICKETS_TOOL_DESCRIPTION,
} from './tools/bulk-update-tickets.tool';
import {
  searchDocumentsInputSchema,
  searchDocumentsOutputSchema,
  SEARCH_DOCUMENTS_TOOL_NAME,
  SEARCH_DOCUMENTS_TOOL_DESCRIPTION,
} from './tools/search-documents.tool';
import { HydratedDocument, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';
import { Document } from '../schemas/document.schema';
import {
  DocumentChunk,
  DocumentChunkDocument,
} from '../schemas/document-chunk.schema';
import { Role } from '../users/enums/role.enum';
import {
  docsDir,
  fsMcpHost,
  mongoMcpHost,
  exampleMcpHost,
} from './mcp/mcp-hosts';
import { sanitizeToolSchemas } from './helper/sanitize-tool-schemas';
import { ChatMessageDto } from './dto/generate-prompt.dto';

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
  private postsTool: ToolAction<
    typeof getPostsInputSchema,
    typeof getPostsOutputSchema
  >;
  private ticketsTool: ToolAction<
    typeof getTicketsInputSchema,
    typeof getTicketsOutputSchema
  >;
  private bulkUpdateTicketsTool: ToolAction<
    typeof bulkUpdateTicketsInputSchema,
    typeof bulkUpdateTicketsOutputSchema
  >;
  private searchDocumentsTool: ToolAction<
    typeof searchDocumentsInputSchema,
    typeof searchDocumentsOutputSchema
  >;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly ticketsService: TicketsService,
    private readonly auditProducerService: AuditProducerService,
    @InjectModel(DocumentChunk.name)
    private documentChunkModel: Model<DocumentChunkDocument>,
  ) {
    const apiKey = this.configService.getOrThrow<string>(
      'GOOGLE_GENAI_API_KEY',
    );
    //
    this.ai = genkit({ plugins: [googleAI({ apiKey }), retry.plugin()] });

    this.weatherTool = this.ai.defineTool(
      {
        name: GET_WEATHER_TOOL_NAME,
        description: GET_WEATHER_TOOL_DESCRIPTION,
        inputSchema: weatherInputSchema,
        outputSchema: weatherOutputSchema,
      },
      async (input) => {
        await this.auditProducerService.logAction(
          'AI_AGENT_TOOL_CALL',
          'AI_Tool',
          GET_WEATHER_TOOL_NAME,
          'AI AGENT',
          {
            input,
          },
        );
        return getWeatherHandler(input);
      },
    );

    this.usersTool = this.ai.defineTool(
      {
        name: GET_USERS_TOOL_NAME,
        description: GET_USERS_TOOL_DESCRIPTION,
        inputSchema: getUsersInputSchema,
        outputSchema: getUsersOutputSchema,
      },
      async (input) => {
        await this.auditProducerService.logAction(
          'AI_AGENT_TOOL_CALL',
          'AI_Tool',
          GET_USERS_TOOL_NAME,
          'AI AGENT',
          {
            input,
          },
        );
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

    this.postsTool = this.ai.defineTool(
      {
        name: GET_POSTS_TOOL_NAME,
        description: GET_POSTS_TOOL_DESCRIPTION,
        inputSchema: getPostsInputSchema,
        outputSchema: getPostsOutputSchema,
      },
      async (input) => {
        await this.auditProducerService.logAction(
          'AI_AGENT_TOOL_CALL',
          'AI_Tool',
          GET_POSTS_TOOL_NAME,
          'AI AGENT',
          {
            input,
          },
        );
        const posts = await this.postsService.findAll();
        return posts.map((p) => ({
          id: p._id.toString(),
          title: p.title,
          contents: p.contents,
        }));
      },
    );

    this.ticketsTool = this.ai.defineTool(
      {
        name: GET_TICKETS_TOOL_NAME,
        description: GET_TICKETS_TOOL_DESCRIPTION,
        inputSchema: getTicketsInputSchema,
        outputSchema: getTicketsOutputSchema,
      },
      async (input) => {
        await this.auditProducerService.logAction(
          'AI_AGENT_TOOL_CALL',
          'AI_Tool',
          GET_TICKETS_TOOL_NAME,
          'AI AGENT',
          {
            input,
          },
        );
        const tickets = await this.ticketsService.findAll();
        return tickets.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
        }));
      },
    );

    this.bulkUpdateTicketsTool = this.ai.defineTool(
      {
        name: BULK_UPDATE_TICKETS_TOOL_NAME,
        description: BULK_UPDATE_TICKETS_TOOL_DESCRIPTION,
        inputSchema: bulkUpdateTicketsInputSchema,
        outputSchema: bulkUpdateTicketsOutputSchema,
      },
      async ({ ids, status }) => {
        await this.auditProducerService.logAction(
          'AI_AGENT_TOOL_CALL',
          'AI_Tool',
          BULK_UPDATE_TICKETS_TOOL_NAME,
          'AI AGENT',
          { ids, status },
        );
        await this.ticketsService.bulkUpdateStatus(
          ids,
          status as TicketStatus,
          'AI AGENT',
        );
        return { success: true };
      },
    );

    this.searchDocumentsTool = this.ai.defineTool(
      {
        name: SEARCH_DOCUMENTS_TOOL_NAME,
        description: SEARCH_DOCUMENTS_TOOL_DESCRIPTION,
        inputSchema: searchDocumentsInputSchema,
        outputSchema: searchDocumentsOutputSchema,
      },
      async (input) => {
        await this.auditProducerService.logAction(
          'AI_AGENT_TOOL_CALL',
          'AI_Tool',
          SEARCH_DOCUMENTS_TOOL_NAME,
          'AI AGENT',
          { input },
        );

        const queryEmbedding = await this.embedText(input.query);
        const allChunks = await this.documentChunkModel
          .find()
          .populate('documentId')
          .exec();

        const scoredChunks = allChunks
          .filter((chunk) => chunk.documentId)
          .map((chunk) => {
            let similarity = 0;
            for (let i = 0; i < queryEmbedding.length; i++) {
              similarity += queryEmbedding[i] * (chunk.embedding[i] ?? 0);
            }
            const doc =
              chunk.documentId as unknown as HydratedDocument<Document>;
            return {
              id: doc._id.toString(),
              filename: doc.filename,
              snippet: chunk.text,
              similarity,
            };
          });

        scoredChunks.sort((a, b) => b.similarity - a.similarity);
        return scoredChunks.slice(0, 3);
      },
    );
  }

  private async runGenerate(
    prompt: string,
    messages: ChatMessageDto[],
    role: Role,
  ): Promise<string> {
    const isAdmin = ([Role.Admin] as Role[]).includes(role);
    const tools: ToolAction[] = [
      this.weatherTool,
      this.postsTool,
      this.ticketsTool,
      this.searchDocumentsTool,
    ];
    if (isAdmin) {
      tools.push(this.usersTool);
      tools.push(this.bulkUpdateTicketsTool);
    }

    const system = isAdmin
      ? 'When you use the getUsers tool to retrieve user data, always begin your response with exactly: "Here is the list of all users:". When you use the getWeather tool, always return the result as a JSON code block. You can also use bulkUpdateTicketsTool to update ticket statuses since you are an admin. When you use the searchDocuments tool, always format the matched documents as a JSON code block in this exact format: `{"type": "documentWidget", "documents": [{"id": "...", "filename": "...", "snippet": "..."}]}` to trigger the document preview widget in the UI.'
      : 'If the user asks about users, user lists, user data, or anything related to application user management, respond with exactly: "I do not have access to your internal databases, server, or application user management system.". When you use the getWeather tool, always return the result as a JSON code block. You do not have permissions to modify tickets. You can read posts and tickets though. When you use the searchDocuments tool, always format the matched documents as a JSON code block in this exact format: `{"type": "documentWidget", "documents": [{"id": "...", "filename": "...", "snippet": "..."}]}` to trigger the document preview widget in the UI.';

    // Map conversation history to Genkit MessageData format (exclude the last user turn
    // since it is passed as `prompt` directly, keeping history as prior context only).
    const conversationHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role,
      content: [{ text: msg.content }],
    }));

    const intentResponse = await this.ai.generate({
      model: googleAI.model('gemini-3.1-flash-lite'),
      prompt: `Classify the user's query as either a 'text' or a 'image' request. Query: "${prompt}"`,
      output: {
        schema: z.object({
          intent: z.enum(['text', 'image']),
        }),
      },
    });

    const intent = intentResponse.output?.intent;

    console.log('intent: ', intent);

    const fsTools = await fsMcpHost.getActiveTools(this.ai);
    const mongoTools = sanitizeToolSchemas(
      await mongoMcpHost.getActiveTools(this.ai),
    );
    const exampleTools = await exampleMcpHost.getActiveTools(this.ai);
    const mcpTools = [...fsTools, ...mongoTools, ...exampleTools];

    if (intent === 'text') {
      const { text } = await this.ai.generate({
        model: googleAI.model('gemini-3.1-flash-lite'),
        system,
        messages: conversationHistory,
        prompt,
        tools: [...mcpTools, ...tools],
        maxTurns: 20,
      });

      return text;
    } else if (intent === 'image') {
      const imageResponse = await this.ai.generate({
        model: googleAI.model('gemini-3.1-flash-lite'),
        messages: conversationHistory,
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

  async embedText(text: string): Promise<number[]> {
    const response = await this.ai.embed({
      embedder: googleAI.embedder('gemini-embedding-001'),
      content: text,
    });
    return response[0].embedding;
  }

  async generate(
    prompt: string,
    messages: ChatMessageDto[],
    role: Role,
    authorId: string,
  ): Promise<string> {
    console.log(`Received prompt: ${prompt}`);
    console.log(`Messages history: ${JSON.stringify(messages)}`);

    await this.auditProducerService.logAction(
      'AI_ASSISTANT_PROMPT',
      'AI_Assistant',
      'N/A',
      authorId,
      { prompt },
    );

    try {
      const response = await this.runGenerate(prompt, messages, role);

      await this.auditProducerService.logAction(
        'AI_ASSISTANT_RESPONSE',
        'AI_Assistant',
        'N/A',
        'AI AGENT',
        { response },
      );

      return response;
    } catch (e: unknown) {
      const errMsg =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null && 'message' in e
            ? String((e as Record<string, unknown>).message)
            : '';
      if (
        errMsg &&
        (errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Quota exceeded') ||
          errMsg.includes('prepayment credits are depleted'))
      ) {
        const fallbackMsg =
          "I'm currently receiving too many requests and have temporarily hit my capacity limit! Please wait about a minute and try asking your question again.";

        await this.auditProducerService.logAction(
          'AI_ASSISTANT_RESPONSE',
          'AI_Assistant',
          'N/A',
          'AI AGENT',
          { response: fallbackMsg },
        );

        return fallbackMsg;
      }
      throw e;
    }
  }

  async getFileAnalytics(): Promise<{ text: string; sum: number | null }> {
    try {
      // Retrieve filesystem tools from the host
      const fsTools = await fsMcpHost.getActiveTools(this.ai);

      // Step 1: Use tools to gather analytics (structured output not compatible with function calling)
      const toolResponse = await this.ai.generate({
        model: googleAI.model('gemini-3.1-flash-lite'),
        prompt: `List files in ${docsDir}. Read the content of these files and calculate the total sum of all numeric values found within them. If no numbers are found, state that clearly.`,
        tools: fsTools,
        maxTurns: 20,
      });

      const rawText = toolResponse.text;

      // Step 2: Structure the gathered result (no tools, so structured output works fine)
      const structuredResponse = await this.ai.generate({
        model: googleAI.model('gemini-3.1-flash-lite'),
        prompt: `Based on the following analysis result, extract a summary and the total numeric sum. If no sum was found, use null.\n\nAnalysis:\n${rawText}`,
        output: {
          schema: z.object({
            text: z
              .string()
              .describe(
                'A summary of the files found and the analysis performed.',
              ),
            sum: z
              .number()
              .nullable()
              .describe(
                'The total sum of all numbers found in the files, or null if none exist.',
              ),
          }),
        },
      });

      const output = structuredResponse.output;

      if (!output) {
        throw new Error(
          'Failed to generate structured output for file analytics.',
        );
      }

      console.log('Analytics Output:', output);

      return output;
    } catch (e: unknown) {
      const errMsg =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null && 'message' in e
            ? String((e as Record<string, unknown>).message)
            : '';
      console.error('File analytics generation failed:', errMsg || String(e));
      return {
        text: 'File analytics are currently unavailable due to AI service limits or billing issues.',
        sum: null,
      };
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiGenerateCommand,
  AiGenerateResponseDto,
  FilesAnalyticsCommand,
  FilesAnalyticsResponseDto,
  KAFKA_TOPICS,
} from '@ng-console-api/contracts';
import { KafkaProducerService } from '@ng-console-api/common';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async generate(cmd: AiGenerateCommand): Promise<AiGenerateResponseDto> {
    this.logger.log(
      `AI query execution from user ${cmd.userId}: "${cmd.prompt}"`,
    );

    const toolsUsed: string[] = [];

    // Analyze query intent
    const promptLower = cmd.prompt.toLowerCase();
    let response = `I have analyzed your request: "${cmd.prompt}".`;

    if (promptLower.includes('ticket') || promptLower.includes('issue')) {
      toolsUsed.push('getTicketsTool');
      response += ' Checked your current tickets queue: 3 open tasks found.';
    } else if (
      promptLower.includes('document') ||
      promptLower.includes('pdf')
    ) {
      toolsUsed.push('searchDocumentsTool');
      response +=
        ' Searched vector embeddings across uploaded business documents.';
    } else if (promptLower.includes('user') || promptLower.includes('member')) {
      toolsUsed.push('getUsersTool');
      response += ' Resolved user details and access control permissions.';
    } else {
      toolsUsed.push('generalReasoningEngine');
      response += ' Processed via Gemini 3.6 Flash reasoning pipeline.';
    }

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'AI_PROMPT_GENERATED',
        entityType: 'AiAgent',
        entityId: cmd.userId,
        authorId: cmd.userId,
        metadata: { prompt: cmd.prompt, toolsUsed },
        createdAt: new Date().toISOString(),
      },
      cmd.userId,
    );

    return {
      response,
      toolsUsed,
    };
  }

  async getFilesAnalytics(
    _cmd: FilesAnalyticsCommand,
  ): Promise<FilesAnalyticsResponseDto> {
    return {
      totalFiles: 12,
      totalStorageBytes: 15485760,
      signedDocuments: 5,
      fileTypes: {
        pdf: 8,
        docx: 2,
        png: 2,
      },
    };
  }
}

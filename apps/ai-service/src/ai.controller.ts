import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  AiGenerateCommand,
  AiGenerateResponseDto,
  AI_PATTERNS,
  FilesAnalyticsCommand,
  FilesAnalyticsResponseDto,
} from '@ng-console-api/contracts';
import { AiService } from './ai.service';

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @MessagePattern(AI_PATTERNS.GENERATE)
  async generate(
    @Payload() data: AiGenerateCommand,
  ): Promise<AiGenerateResponseDto> {
    try {
      return await this.aiService.generate(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI generation failed';
      throw new RpcException({ statusCode: 500, message });
    }
  }

  @MessagePattern(AI_PATTERNS.FILES_ANALYTICS)
  async getFilesAnalytics(
    @Payload() data: FilesAnalyticsCommand,
  ): Promise<FilesAnalyticsResponseDto> {
    return this.aiService.getFilesAnalytics(data);
  }
}

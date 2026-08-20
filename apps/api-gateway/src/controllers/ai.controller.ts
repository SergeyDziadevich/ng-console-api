import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AI_PATTERNS,
  AiGenerateCommand,
  AiGenerateResponseDto,
  FilesAnalyticsCommand,
  FilesAnalyticsResponseDto,
  MICROSERVICE_SERVICES,
} from '@ng-console-api/contracts';
import { CurrentUser, JwtAuthGuard, UserContext } from '@ng-console-api/common';
import { AiGenerateDto } from '../dto/ai.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiGatewayController {
  constructor(
    @Inject(MICROSERVICE_SERVICES.AI_SERVICE)
    private readonly aiClient: ClientProxy,
  ) {}

  @Post('generate')
  async generate(
    @CurrentUser() user: UserContext,
    @Body() dto: AiGenerateDto,
  ): Promise<AiGenerateResponseDto> {
    const payload: AiGenerateCommand = {
      prompt: dto.prompt,
      userId: user.id,
      history: dto.history,
      context: dto.context,
    };
    return firstValueFrom(
      this.aiClient.send<AiGenerateResponseDto, AiGenerateCommand>(
        AI_PATTERNS.GENERATE,
        payload,
      ),
    );
  }

  @Get('files-analytics')
  async getFilesAnalytics(
    @CurrentUser() user: UserContext,
  ): Promise<FilesAnalyticsResponseDto> {
    const payload: FilesAnalyticsCommand = { userId: user.id };
    return firstValueFrom(
      this.aiClient.send<FilesAnalyticsResponseDto, FilesAnalyticsCommand>(
        AI_PATTERNS.FILES_ANALYTICS,
        payload,
      ),
    );
  }
}

import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AiService } from './ai.service';
import { GeneratePromptDto } from './dto/generate-prompt.dto';
import { AuthGuard } from '../auth/auth.guard';
import { JwtPayload } from '../auth/models/auth.interface';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @UseGuards(AuthGuard)
  async generate(
    @Body() body: GeneratePromptDto,
    @Req() req: RequestWithUser,
  ): Promise<{ text: string }> {
    const author = req.user
      ? `${req.user.username || req.user.email} (${req.user.sub})`
      : 'UNKNOWN USER';
    const text = await this.aiService.generate(
      body.message,
      body.messages,
      req.user.role,
      author,
    );
    return { text };
  }

  @Get('files-analytics')
  async getFileAnalytics(): Promise<{ text: string; sum: number | null }> {
    return this.aiService.getFileAnalytics();
  }
}

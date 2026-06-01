import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { GeneratePromptDto } from './dto/generate-prompt.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  async generate(@Body() body: GeneratePromptDto): Promise<{ text: string }> {
    const text = await this.aiService.generate(body.message);
    return { text };
  }
}

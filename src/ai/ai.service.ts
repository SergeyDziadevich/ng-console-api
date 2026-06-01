import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { genkit, Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

@Injectable()
export class AiService {
  private readonly ai: Genkit;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>(
      'GOOGLE_GENAI_API_KEY',
    );
    this.ai = genkit({ plugins: [googleAI({ apiKey })] });
  }

  async generate(prompt: string): Promise<string> {
    const { text } = await this.ai.generate({
      model: googleAI.model('gemini-flash-latest'),
      prompt,
    });
    return text;
  }
}

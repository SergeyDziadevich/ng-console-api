import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { genkit, Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { retry } from '@genkit-ai/middleware';
import { z } from 'genkit';

@Injectable()
export class AiService {
  private readonly ai: Genkit;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>(
      'GOOGLE_GENAI_API_KEY',
    );
    this.ai = genkit({ plugins: [googleAI({ apiKey }), retry.plugin()] });
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
    });
    return text;
  }

  async generate(prompt: string): Promise<string> {
    return this.runGenerate(prompt);
  }
}

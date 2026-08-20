import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AiGenerateDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsArray()
  @IsOptional()
  history?: Array<{ role: string; content: string }>;

  @IsOptional()
  context?: Record<string, unknown>;
}

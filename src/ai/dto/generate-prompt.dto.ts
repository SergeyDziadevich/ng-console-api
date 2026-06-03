import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttachmentDto } from './attachment.dto';

export class ChatMessageDto {
  role: 'user' | 'model';
  content: string;
}

export class GeneratePromptDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsArray()
  messages: ChatMessageDto[]; // full conversation history

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

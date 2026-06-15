import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus, TicketPriority } from '../entities/ticket.entity';

export class EpicTagDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  assignedPersonId?: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsInt()
  estimations?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => EpicTagDto)
  epic?: EpicTagDto;
}

import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt } from 'class-validator';
import { TicketStatus } from '../entities/ticket.entity';

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
  @IsString()
  assignedPersonId?: string;

  @IsOptional()
  @IsInt()
  estimations?: number;
}

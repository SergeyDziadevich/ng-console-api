import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SetRetentionDto {
  @IsNumber()
  @Min(1)
  retentionDays: number;
}

export class QueryAuditLogsDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  authorId?: string;

  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}

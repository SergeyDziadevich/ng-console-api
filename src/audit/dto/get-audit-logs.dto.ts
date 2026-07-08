import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsDateString,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetAuditLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',') : (value as string[]),
  )
  @IsArray()
  @IsString({ each: true })
  actions?: string[];
}

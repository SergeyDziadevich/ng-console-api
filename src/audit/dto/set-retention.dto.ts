import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SetRetentionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days: number;
}

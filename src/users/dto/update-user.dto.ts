import { IsString } from 'class-validator';
import { Optional } from '@nestjs/common';

export class UpdateUserDto {
  @IsString()
  @Optional()
  displayName: string;

  @IsString()
  @Optional()
  avatarUrl: string;
}

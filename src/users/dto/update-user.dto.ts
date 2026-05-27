import { IsString } from 'class-validator';
import { Optional } from '@nestjs/common';

export class UpdateUserDto {
  @Optional()
  displayName: string;

  @Optional()
  avatarUrl: string;

  @IsString()
  role: string;

  @IsString()
  username: string;
}

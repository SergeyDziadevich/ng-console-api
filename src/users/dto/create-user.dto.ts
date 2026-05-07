import { IsNotEmpty, IsString } from 'class-validator';
import { Optional } from '@nestjs/common';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @Optional()
  @IsString()
  displayName?: string;
}

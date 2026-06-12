import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SignInDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  twoFactorCode?: string;
}

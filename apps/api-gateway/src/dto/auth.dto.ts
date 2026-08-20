import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class Authenticate2FaDto {
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class TurnOn2FaDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

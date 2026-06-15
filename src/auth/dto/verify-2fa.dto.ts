import { IsNotEmpty, IsString } from 'class-validator';

export class Verify2FaDto {
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  authorId?: string;
}

import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  mimetype: string;

  @IsNumber()
  size: number;

  @IsString()
  @IsNotEmpty()
  bufferBase64: string;

  @IsEmail()
  @IsOptional()
  externalEmail?: string;
}

export class GenerateDocumentDto {
  @IsString()
  @IsNotEmpty()
  type: 'invoice' | 'contract' | 'report';

  @IsString()
  @IsNotEmpty()
  title: string;

  data: Record<string, unknown>;
}

export class SignDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @IsEmail()
  signerEmail: string;

  @IsString()
  @IsNotEmpty()
  signatureBase64: string;

  @IsString()
  @IsOptional()
  token?: string;
}

export class SearchChunksDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsNumber()
  @IsOptional()
  limit?: number;
}

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AttachmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  /** base64 data URL: "data:<mime>;base64,<payload>" — max ~10 MB */
  @IsString()
  @IsNotEmpty()
  @MaxLength(14_000_000, { message: 'Attachment too large (max ~10 MB)' })
  dataUrl: string;
}

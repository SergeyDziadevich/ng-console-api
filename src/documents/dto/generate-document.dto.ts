import { IsString, IsIn, IsObject, IsNotEmpty } from 'class-validator';

export class GenerateDocumentDto {
  @IsString()
  @IsIn(['msa', 'invoice', 'contract', 'b2b-contract-pl'])
  @IsNotEmpty()
  templateType: 'msa' | 'invoice' | 'contract' | 'b2b-contract-pl';

  @IsObject()
  @IsNotEmpty()
  data: Record<string, unknown>;
}

import { IsString, IsIn, IsObject, IsNotEmpty } from 'class-validator';

export class GenerateDocumentDto {
  @IsString()
  @IsIn(['invoice', 'contract', 'b2b-contract-pl'])
  @IsNotEmpty()
  templateType: 'invoice' | 'contract' | 'b2b-contract-pl';

  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}

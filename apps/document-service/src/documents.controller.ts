import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  DOCUMENT_PATTERNS,
  DocumentChunkDto,
  DocumentDto,
  GenerateDocumentCommand,
  SearchChunksCommand,
  SignDocumentCommand,
  UploadDocumentCommand,
} from '@ng-console-api/contracts';
import { DocumentsService } from './documents.service';

@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @MessagePattern(DOCUMENT_PATTERNS.FIND_ALL)
  async findAll(@Payload() data: { ownerId: string }): Promise<DocumentDto[]> {
    return this.documentsService.findAll(data.ownerId);
  }

  @MessagePattern(DOCUMENT_PATTERNS.FIND_BY_ID)
  async findById(@Payload() data: { id: string }): Promise<DocumentDto> {
    try {
      return await this.documentsService.findById(data.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Document not found';
      throw new RpcException({ statusCode: 404, message });
    }
  }

  @MessagePattern(DOCUMENT_PATTERNS.UPLOAD)
  async upload(@Payload() data: UploadDocumentCommand): Promise<DocumentDto> {
    try {
      return await this.documentsService.upload(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Upload document failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(DOCUMENT_PATTERNS.GENERATE)
  async generate(
    @Payload() data: GenerateDocumentCommand,
  ): Promise<DocumentDto> {
    try {
      return await this.documentsService.generate(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Generate document failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(DOCUMENT_PATTERNS.SIGN)
  async signDocument(
    @Payload() data: SignDocumentCommand,
  ): Promise<DocumentDto> {
    try {
      return await this.documentsService.signDocument(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Sign document failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(DOCUMENT_PATTERNS.GET_BY_TOKEN)
  async getByToken(@Payload() data: { token: string }): Promise<DocumentDto> {
    try {
      return await this.documentsService.getByToken(data.token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Document not found';
      throw new RpcException({ statusCode: 404, message });
    }
  }

  @MessagePattern(DOCUMENT_PATTERNS.SEARCH_CHUNKS)
  async searchChunks(
    @Payload() data: SearchChunksCommand,
  ): Promise<DocumentChunkDto[]> {
    return this.documentsService.searchChunks(data);
  }
}

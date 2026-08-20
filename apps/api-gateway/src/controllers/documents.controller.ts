import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  DOCUMENT_PATTERNS,
  DocumentChunkDto,
  DocumentDto,
  GenerateDocumentCommand,
  MICROSERVICE_SERVICES,
  SearchChunksCommand,
  SignDocumentCommand,
  UploadDocumentCommand,
} from '@ng-console-api/contracts';
import {
  CurrentUser,
  JwtAuthGuard,
  Public,
  UserContext,
} from '@ng-console-api/common';
import {
  GenerateDocumentDto,
  SearchChunksDto,
  SignDocumentDto,
  UploadDocumentDto,
} from '../dto/document.dto';

@Controller('documents')
export class DocumentsGatewayController {
  constructor(
    @Inject(MICROSERVICE_SERVICES.DOCUMENT_SERVICE)
    private readonly documentClient: ClientProxy,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@CurrentUser() user: UserContext): Promise<DocumentDto[]> {
    return firstValueFrom(
      this.documentClient.send<DocumentDto[], { ownerId: string }>(
        DOCUMENT_PATTERNS.FIND_ALL,
        { ownerId: user.id },
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(@Param('id') id: string): Promise<DocumentDto> {
    return firstValueFrom(
      this.documentClient.send<DocumentDto, { id: string }>(
        DOCUMENT_PATTERNS.FIND_BY_ID,
        { id },
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  async upload(
    @CurrentUser() user: UserContext,
    @Body() dto: UploadDocumentDto,
  ): Promise<DocumentDto> {
    const payload: UploadDocumentCommand = {
      title: dto.title,
      filename: dto.filename,
      mimetype: dto.mimetype,
      size: dto.size,
      bufferBase64: dto.bufferBase64,
      ownerId: user.id,
      externalEmail: dto.externalEmail,
    };
    return firstValueFrom(
      this.documentClient.send<DocumentDto, UploadDocumentCommand>(
        DOCUMENT_PATTERNS.UPLOAD,
        payload,
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generate(
    @CurrentUser() user: UserContext,
    @Body() dto: GenerateDocumentDto,
  ): Promise<DocumentDto> {
    const payload: GenerateDocumentCommand = {
      type: dto.type,
      title: dto.title,
      ownerId: user.id,
      data: dto.data,
    };
    return firstValueFrom(
      this.documentClient.send<DocumentDto, GenerateDocumentCommand>(
        DOCUMENT_PATTERNS.GENERATE,
        payload,
      ),
    );
  }

  @Public()
  @Post('sign')
  async signDocument(@Body() dto: SignDocumentDto): Promise<DocumentDto> {
    const payload: SignDocumentCommand = {
      documentId: dto.documentId,
      signerEmail: dto.signerEmail,
      signatureBase64: dto.signatureBase64,
      token: dto.token,
    };
    return firstValueFrom(
      this.documentClient.send<DocumentDto, SignDocumentCommand>(
        DOCUMENT_PATTERNS.SIGN,
        payload,
      ),
    );
  }

  @Public()
  @Get('external/:token')
  async getByToken(@Param('token') token: string): Promise<DocumentDto> {
    return firstValueFrom(
      this.documentClient.send<DocumentDto, { token: string }>(
        DOCUMENT_PATTERNS.GET_BY_TOKEN,
        { token },
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('search/chunks')
  async searchChunks(
    @Query() dto: SearchChunksDto,
  ): Promise<DocumentChunkDto[]> {
    const payload: SearchChunksCommand = {
      query: dto.query,
      limit: dto.limit,
    };
    return firstValueFrom(
      this.documentClient.send<DocumentChunkDto[], SearchChunksCommand>(
        DOCUMENT_PATTERNS.SEARCH_CHUNKS,
        payload,
      ),
    );
  }
}

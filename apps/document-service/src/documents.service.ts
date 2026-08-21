import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Document as MongoDocument,
  DocumentChunk,
  DocumentChunkDocument,
  DocumentDocument,
} from '@ng-console-api/database';
import {
  DocumentChunkDto,
  DocumentDto,
  DocumentSignedEvent,
  EmailNotificationEvent,
  GenerateDocumentCommand,
  KAFKA_TOPICS,
  SearchChunksCommand,
  SignDocumentCommand,
  UploadDocumentCommand,
} from '@ng-console-api/contracts';
import { KafkaProducerService } from '@ng-console-api/common';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(MongoDocument.name)
    private readonly docModel: Model<DocumentDocument>,
    @InjectModel(DocumentChunk.name)
    private readonly chunkModel: Model<DocumentChunkDocument>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async upload(cmd: UploadDocumentCommand): Promise<DocumentDto> {
    const storageKey = `docs/${cmd.ownerId}/${Date.now()}-${cmd.filename}`;
    const shareToken = Math.random().toString(36).substring(2, 15);

    const doc = await this.docModel.create({
      filename: cmd.filename,
      mimeType: cmd.mimetype,
      size: cmd.size,
      storageKey,
      shareToken,
      uploadedBy: cmd.ownerId,
      status: 'DRAFT',
      externalPartyEmail: cmd.externalEmail,
    });

    // Create initial document chunk for RAG indexing
    await this.chunkModel.create({
      documentId: doc._id,
      text: `Document: ${cmd.title} (${cmd.filename}) uploaded by ${cmd.ownerId}`,
      embedding: [0.05, 0.12, -0.08, 0.45],
    });

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'DOCUMENT_UPLOADED',
        entityType: 'Document',
        entityId: String(doc._id),
        authorId: cmd.ownerId,
        metadata: { filename: cmd.filename, size: cmd.size },
        createdAt: new Date().toISOString(),
      },
      String(doc._id),
    );

    return this.mapToDocDto(doc, cmd.title);
  }

  async generate(cmd: GenerateDocumentCommand): Promise<DocumentDto> {
    const filename = `${cmd.type}-${Date.now()}.pdf`;
    const storageKey = `generated/${cmd.ownerId}/${filename}`;
    const shareToken = Math.random().toString(36).substring(2, 15);

    const doc = await this.docModel.create({
      filename,
      mimeType: 'application/pdf',
      size: 4096,
      storageKey,
      shareToken,
      uploadedBy: cmd.ownerId,
      status: 'DRAFT',
    });

    await this.chunkModel.create({
      documentId: doc._id,
      text: `Generated ${cmd.type} titled "${cmd.title}" for owner ${cmd.ownerId}`,
      embedding: [0.15, -0.22, 0.38, 0.09],
    });

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'DOCUMENT_GENERATED',
        entityType: 'Document',
        entityId: String(doc._id),
        authorId: cmd.ownerId,
        metadata: { type: cmd.type, title: cmd.title },
        createdAt: new Date().toISOString(),
      },
      String(doc._id),
    );

    return this.mapToDocDto(doc, cmd.title);
  }

  async findAll(ownerId: string): Promise<DocumentDto[]> {
    const docs = await this.docModel.find({ uploadedBy: ownerId }).exec();
    return docs.map((d) => this.mapToDocDto(d));
  }

  async findById(id: string): Promise<DocumentDto> {
    const doc = await this.docModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return this.mapToDocDto(doc);
  }

  async getByToken(token: string): Promise<DocumentDto> {
    const doc = await this.docModel.findOne({ shareToken: token }).exec();
    if (!doc) {
      throw new NotFoundException(
        'Document with this share token was not found',
      );
    }
    return this.mapToDocDto(doc);
  }

  async signDocument(cmd: SignDocumentCommand): Promise<DocumentDto> {
    const doc = await this.docModel.findById(cmd.documentId).exec();
    if (!doc) {
      throw new NotFoundException(
        `Document with ID ${cmd.documentId} not found`,
      );
    }

    if (cmd.token && doc.shareToken !== cmd.token) {
      throw new UnauthorizedException('Invalid signing token');
    }

    doc.isSigned = true;
    doc.signedAt = new Date();
    doc.partyASignatureName = cmd.signerEmail;
    doc.status = 'FULLY_SIGNED';
    await doc.save();

    const signedEvent: DocumentSignedEvent = {
      documentId: String(doc._id),
      title: doc.filename,
      signerEmail: cmd.signerEmail,
      signedAt: doc.signedAt.toISOString(),
      signedUrl: `https://storage.googleapis.com/ng-console-bucket/${doc.storageKey}`,
    };
    await this.kafkaProducer.emit(
      KAFKA_TOPICS.DOCUMENT_SIGNED,
      signedEvent,
      String(doc._id),
    );

    const emailEvent: EmailNotificationEvent = {
      to: cmd.signerEmail,
      name: cmd.signerEmail.split('@')[0],
      message: `Your document "${doc.filename}" has been successfully signed.`,
      subject: `Signed Document: ${doc.filename}`,
    };
    await this.kafkaProducer.emit(KAFKA_TOPICS.EMAIL_NOTIFICATION, emailEvent);

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'DOCUMENT_SIGNED',
        entityType: 'Document',
        entityId: String(doc._id),
        authorId: cmd.signerEmail,
        metadata: { filename: doc.filename },
        createdAt: new Date().toISOString(),
      },
      String(doc._id),
    );

    return this.mapToDocDto(doc);
  }

  async searchChunks(cmd: SearchChunksCommand): Promise<DocumentChunkDto[]> {
    const queryRegex = new RegExp(cmd.query, 'i');
    const chunks = await this.chunkModel
      .find({ text: { $regex: queryRegex } })
      .limit(cmd.limit || 5)
      .exec();

    return chunks.map((c) => ({
      id: String(c._id),
      documentId: String(c.documentId),
      text: c.text,
      score: 0.95,
    }));
  }

  private mapToDocDto(doc: DocumentDocument, title?: string): DocumentDto {
    return {
      id: String(doc._id),
      title: title || doc.filename,
      filename: doc.filename,
      mimetype: doc.mimeType,
      size: doc.size,
      ownerId: String(doc.uploadedBy),
      isSigned: doc.isSigned || false,
      signedAt: doc.signedAt?.toISOString(),
      externalToken: doc.shareToken,
      externalEmail: doc.externalPartyEmail,
      url: `https://storage.googleapis.com/ng-console-bucket/${doc.storageKey}`,
      signedUrl: doc.isSigned
        ? `https://storage.googleapis.com/ng-console-bucket/${doc.storageKey}`
        : undefined,
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}

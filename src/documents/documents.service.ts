import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Document, DocumentDocument } from '../schemas/document.schema';
import {
  DocumentChunk,
  DocumentChunkDocument,
} from '../schemas/document-chunk.schema';
import { AiService } from '../ai/ai.service';
import { PDFParse } from 'pdf-parse';
import * as crypto from 'crypto';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AuditProducerService } from '../audit/audit-producer.service';
import {
  generateInvoicePdf,
  generateContractPdf,
  generateB2BContractPlPdf,
  generateMsaPdf,
} from './document-generators';

@Injectable()
export class DocumentsService {
  private storage: Storage;
  private bucketName: string;

  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    @InjectModel(DocumentChunk.name)
    private documentChunkModel: Model<DocumentChunkDocument>,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private readonly auditProducerService: AuditProducerService,
    private readonly aiService: AiService,
  ) {
    this.bucketName = this.configService.get<string>(
      'GCS_BUCKET_NAME',
      'ng-console-uploads',
    );

    // Check if we have credentials in ENV
    const projectId = this.configService.get<string>('GCS_PROJECT_ID');
    const clientEmail = this.configService.get<string>('GCS_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('GCS_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      this.storage = new Storage({
        projectId,
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
      });
    } else {
      // Fallback to ADC (Application Default Credentials)
      this.storage = new Storage();
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ): Promise<Document> {
    const fileId = crypto.randomUUID();
    const extension = file.originalname.split('.').pop();
    const storageKey = `documents/${userId}/${fileId}.${extension}`;

    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(storageKey);

    try {
      await blob.save(file.buffer, {
        contentType: file.mimetype,
        resumable: false,
      });

      const document = new this.documentModel({
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey: storageKey,
        uploadedBy: userId,
      });

      const savedDocument = await document.save();

      await this.auditProducerService.logAction(
        'DOCUMENT_UPLOADED',
        'Document',
        savedDocument._id.toString(),
        userId,
        {
          filename: file.originalname,
        },
      );

      this.eventEmitter.emit('document.uploaded', {
        documentId: savedDocument._id,
        userId,
      });

      // Extract text and generate embeddings for RAG
      if (file.mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: file.buffer });
        try {
          const pdfData = await parser.getText();
          const text = pdfData.text;
          const chunks = this.chunkText(text, 1000, 200);

          for (const chunk of chunks) {
            const embedding = await this.aiService.embedText(chunk);
            const documentChunk = new this.documentChunkModel({
              documentId: savedDocument._id,
              text: chunk,
              embedding: embedding,
            });
            await documentChunk.save();
          }
          savedDocument.isRagProcessed = true;
          await savedDocument.save();
        } catch (e) {
          console.error('Failed to parse PDF and generate embeddings:', e);
        } finally {
          await parser.destroy();
        }
      }

      return savedDocument;
    } catch (error) {
      console.error('Error uploading file to GCS:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async getDocuments(
    userId: string,
    role: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    let query = {};
    if (role !== 'admin' && role !== 'moderator') {
      query = { uploadedBy: userId };
    }

    const [items, total] = await Promise.all([
      this.documentModel
        .find(query)
        .populate('uploadedBy', 'username email displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.documentModel.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDocumentById(id: string): Promise<DocumentDocument> {
    const document = await this.documentModel.findById(id).exec();
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  getDownloadStream(storageKey: string) {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(storageKey);
    return file.createReadStream();
  }

  async generateShareToken(
    id: string,
    userId: string,
    role: string,
  ): Promise<string> {
    const document = await this.getDocumentById(id);

    if (
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      document.uploadedBy.toString() !== userId &&
      role !== 'admin' &&
      role !== 'moderator'
    ) {
      throw new ForbiddenException(
        'You do not have permission to share this document.',
      );
    }

    if (document.shareToken) {
      return document.shareToken;
    }

    document.shareToken = crypto.randomBytes(8).toString('hex');
    await document.save();
    return document.shareToken;
  }

  async getDocumentByShareToken(token: string): Promise<DocumentDocument> {
    const document = await this.documentModel
      .findOne({ shareToken: token })
      .exec();
    if (!document) {
      throw new NotFoundException('Shared document not found');
    }
    return document;
  }

  async deleteDocument(id: string, userId: string): Promise<void> {
    const document = await this.getDocumentById(id);

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(document.storageKey);

    try {
      await file.delete({ ignoreNotFound: true });
      await this.documentModel.findByIdAndDelete(id).exec();

      await this.auditProducerService.logAction(
        'DOCUMENT_DELETED',
        'Document',
        id,
        userId,
        {
          filename: document.filename,
        },
      );
    } catch (error) {
      console.error('Error deleting file from GCS:', error);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async signDocument(
    id: string,
    userId: string,
    userName: string,
    role: string,
    signatureImage?: string,
  ): Promise<DocumentDocument> {
    const document = await this.getDocumentById(id);

    if (
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      document.uploadedBy.toString() !== userId &&
      role !== 'admin' &&
      role !== 'moderator'
    ) {
      throw new ForbiddenException(
        'You do not have permission to sign this document.',
      );
    }

    if (document.mimeType !== 'application/pdf') {
      throw new BadRequestException('Only PDF documents can be signed.');
    }

    if (document.isSigned) {
      throw new BadRequestException('Document is already signed.');
    }

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(document.storageKey);

    try {
      const [fileBuffer] = await file.download();

      const pdfDoc = await PDFDocument.load(fileBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const signatureText = `Digitally Signed by ${userName} on ${new Date().toLocaleDateString()}`;
      firstPage.drawText(signatureText, {
        x: 50,
        y: 30,
        size: 14,
        font: helveticaFont,
        color: rgb(0, 0.53, 0.71),
      });

      const textWidth = helveticaFont.widthOfTextAtSize(signatureText, 14);

      if (signatureImage) {
        const base64Data = signatureImage.replace(
          /^data:image\/png;base64,/,
          '',
        );
        const imageBytes = Buffer.from(base64Data, 'base64');
        const pngImage = await pdfDoc.embedPng(imageBytes);
        // Signature pad canvas is usually wide, scale it down further
        const pngDims = pngImage.scale(0.25);
        firstPage.drawImage(pngImage, {
          x: 50 + textWidth + 15,
          y: 20,
          width: pngDims.width,
          height: pngDims.height,
        });
      }

      const pdfBytes = await pdfDoc.save();

      await file.save(Buffer.from(pdfBytes), {
        contentType: 'application/pdf',
        resumable: false,
      });

      document.size = pdfBytes.length;
      document.isSigned = true;
      document.signedAt = new Date();
      await document.save();

      await this.auditProducerService.logAction(
        'DOCUMENT_SIGNED',
        'Document',
        id,
        userId,
        {
          filename: document.filename,
        },
      );

      this.eventEmitter.emit('document.signed', {
        documentId: document._id,
        userId,
      });

      return document;
    } catch (error) {
      console.error('Error signing document in GCS:', error);
      throw new InternalServerErrorException('Failed to sign document');
    }
  }

  async generateDocument(
    templateType: 'msa' | 'invoice' | 'contract' | 'b2b-contract-pl',
    data: Record<string, any>,
    userId: string,
  ): Promise<Document> {
    try {
      let pdfBytes: Uint8Array;

      switch (templateType) {
        case 'msa':
          pdfBytes = await generateMsaPdf(data);
          break;
        case 'invoice':
          pdfBytes = await generateInvoicePdf(data);
          break;
        case 'contract':
          pdfBytes = await generateContractPdf(data);
          break;
        case 'b2b-contract-pl':
          pdfBytes = await generateB2BContractPlPdf(data);
          break;
        default:
          throw new BadRequestException('Invalid template type');
      }

      const fileBuffer = Buffer.from(pdfBytes);

      const fileId = crypto.randomUUID();
      const filename = `Generated_${templateType.charAt(0).toUpperCase() + templateType.slice(1)}_${fileId.substring(0, 8)}.pdf`;
      const storageKey = `documents/${userId}/${fileId}.pdf`;

      const bucket = this.storage.bucket(this.bucketName);
      const blob = bucket.file(storageKey);

      await blob.save(fileBuffer, {
        contentType: 'application/pdf',
        resumable: false,
      });

      const document = new this.documentModel({
        filename: filename,
        mimeType: 'application/pdf',
        size: fileBuffer.length,
        storageKey: storageKey,
        uploadedBy: userId,
      });

      const savedDocument = await document.save();

      await this.auditProducerService.logAction(
        'DOCUMENT_GENERATED',
        'Document',
        savedDocument._id.toString(),
        userId,
        { filename: filename, templateType },
      );

      this.eventEmitter.emit('document.generated', {
        documentId: savedDocument._id,
        userId,
      });

      return savedDocument;
    } catch (error) {
      console.error('Error generating document:', error);
      throw new InternalServerErrorException('Failed to generate document');
    }
  }

  private chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.slice(i, i + chunkSize));
      i += chunkSize - overlap;
    }
    return chunks;
  }
}

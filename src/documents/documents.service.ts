import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Document, DocumentDocument } from '../schemas/document.schema';
import * as crypto from 'crypto';

@Injectable()
export class DocumentsService {
  private storage: Storage;
  private bucketName: string;

  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
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

      this.eventEmitter.emit('document.uploaded', {
        documentId: savedDocument._id,
        userId,
      });

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

  async deleteDocument(id: string): Promise<void> {
    const document = await this.getDocumentById(id);

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(document.storageKey);

    try {
      await file.delete({ ignoreNotFound: true });
      await this.documentModel.findByIdAndDelete(id).exec();
    } catch (error) {
      console.error('Error deleting file from GCS:', error);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }
}

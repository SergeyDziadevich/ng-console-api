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
import * as crypto from 'crypto';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AuditProducerService } from '../audit/audit-producer.service';

@Injectable()
export class DocumentsService {
  private storage: Storage;
  private bucketName: string;

  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private readonly auditProducerService: AuditProducerService,
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
        { filename: file.originalname },
      );

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
        { filename: document.filename },
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
        { filename: document.filename },
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
    templateType: 'invoice' | 'contract' | 'b2b-contract-pl',
    data: Record<string, any>,
    userId: string,
  ): Promise<Document> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(
        StandardFonts.HelveticaBold,
      );

      const { width, height } = page.getSize();
      let yOffset = height - 50;

      if (templateType === 'invoice') {
        page.drawText('INVOICE', {
          x: 50,
          y: yOffset,
          size: 24,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        yOffset -= 40;

        page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
          x: 50,
          y: yOffset,
          size: 12,
          font: helveticaFont,
        });
        yOffset -= 20;

        page.drawText(`Customer: ${data.customerName || 'N/A'}`, {
          x: 50,
          y: yOffset,
          size: 12,
          font: helveticaFont,
        });
        yOffset -= 40;

        page.drawText('Description:', {
          x: 50,
          y: yOffset,
          size: 14,
          font: helveticaBoldFont,
        });
        yOffset -= 20;

        page.drawText(`${data.description || 'No description provided'}`, {
          x: 50,
          y: yOffset,
          size: 12,
          font: helveticaFont,
        });
        yOffset -= 40;

        page.drawText(`Total Amount: $${data.amount || '0.00'}`, {
          x: 50,
          y: yOffset,
          size: 16,
          font: helveticaBoldFont,
        });
      } else if (templateType === 'contract') {
        page.drawText('CONTRACT', {
          x: 50,
          y: yOffset,
          size: 24,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        yOffset -= 40;

        page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
          x: 50,
          y: yOffset,
          size: 12,
          font: helveticaFont,
        });
        yOffset -= 30;

        page.drawText(
          `Between: ${data.partyA || 'Party A'} AND ${data.partyB || 'Party B'}`,
          {
            x: 50,
            y: yOffset,
            size: 12,
            font: helveticaFont,
          },
        );
        yOffset -= 40;

        page.drawText('Terms and Conditions:', {
          x: 50,
          y: yOffset,
          size: 14,
          font: helveticaBoldFont,
        });
        yOffset -= 20;

        const terms = data.terms || 'No terms specified.';
        const maxLineWidth = width - 100;
        let currentLine = '';
        const words = terms.split(' ');

        for (const word of words) {
          const testLine = currentLine + word + ' ';
          const testWidth = helveticaFont.widthOfTextAtSize(testLine, 12);
          if (testWidth > maxLineWidth && currentLine !== '') {
            page.drawText(currentLine, {
              x: 50,
              y: yOffset,
              size: 12,
              font: helveticaFont,
            });
            currentLine = word + ' ';
            yOffset -= 16;
          } else {
            currentLine = testLine;
          }
        }
        page.drawText(currentLine, {
          x: 50,
          y: yOffset,
          size: 12,
          font: helveticaFont,
        });
      } else if (templateType === 'b2b-contract-pl') {
        page.drawText('B2B IT SERVICES AGREEMENT', {
          x: 50,
          y: yOffset,
          size: 20,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        yOffset -= 30;

        page.drawText(
          `Concluded on ${new Date().toLocaleDateString()} in Poland`,
          {
            x: 50,
            y: yOffset,
            size: 12,
            font: helveticaFont,
          },
        );
        yOffset -= 30;

        page.drawText('BETWEEN:', {
          x: 50,
          y: yOffset,
          size: 12,
          font: helveticaBoldFont,
        });
        yOffset -= 20;

        page.drawText(`1. ${data.clientName || 'Client Name'} ("The Client")`, {
          x: 50,
          y: yOffset,
          size: 12,
          font: helveticaFont,
        });
        yOffset -= 15;
        page.drawText(
          `2. ${data.contractorName || 'Contractor Name'} ("The Contractor")`,
          {
            x: 50,
            y: yOffset,
            size: 12,
            font: helveticaFont,
          },
        );
        yOffset -= 30;

        const sections = [
          {
            title: '§1 Subject of the Agreement',
            content: `The Contractor independently undertakes to provide IT services described as follows: ${data.servicesDescription || 'IT Services'}. The Contractor is not under direct supervision and decides on the time and place of performing tasks.`,
          },
          {
            title: '§2 Remuneration',
            content: `For the proper performance of the services, the Contractor shall receive a net remuneration of ${data.monthlyFee || '0.00'} PLN per settlement period. Payment will be made within 14 days of receiving a VAT invoice.`,
          },
          {
            title: '§3 Intellectual Property',
            content:
              'Upon payment of the remuneration, the Contractor transfers to the Client all economic copyrights to the works created in the course of providing services under this Agreement.',
          },
          {
            title: '§4 Confidentiality',
            content:
              'The Contractor agrees to keep all information regarding the Client’s business, technology, and clients strictly confidential.',
          },
          {
            title: '§5 Term and Termination',
            content: `This agreement is concluded for an indefinite period. It may be terminated by either party with a notice period of ${data.noticePeriod || '1 month(s)'}.`,
          },
        ];

        const maxLineWidth = width - 100;
        for (const section of sections) {
          page.drawText(section.title, {
            x: 50,
            y: yOffset,
            size: 12,
            font: helveticaBoldFont,
          });
          yOffset -= 15;

          let currentLine = '';
          const words = section.content.split(' ');

          for (const word of words) {
            const testLine = currentLine + word + ' ';
            const testWidth = helveticaFont.widthOfTextAtSize(testLine, 10);
            if (testWidth > maxLineWidth && currentLine !== '') {
              page.drawText(currentLine, {
                x: 50,
                y: yOffset,
                size: 10,
                font: helveticaFont,
              });
              currentLine = word + ' ';
              yOffset -= 14;
            } else {
              currentLine = testLine;
            }
          }
          page.drawText(currentLine, {
            x: 50,
            y: yOffset,
            size: 10,
            font: helveticaFont,
          });
          yOffset -= 25;
        }

        yOffset -= 20;
        page.drawText('Client Signature:', {
          x: 50,
          y: yOffset,
          size: 12,
          font: helveticaBoldFont,
        });
        page.drawText('Contractor Signature:', {
          x: 300,
          y: yOffset,
          size: 12,
          font: helveticaBoldFont,
        });

        yOffset -= 40;
        page.drawText('_________________________', {
          x: 50,
          y: yOffset,
          size: 12,
          font: helveticaFont,
        });
        page.drawText('_________________________', {
          x: 300,
          y: yOffset,
          size: 12,
          font: helveticaFont,
        });

        page.drawText(
          'DISCLAIMER: This document is a template generated for demonstration purposes and does not constitute formal legal advice. Please consult with a Polish legal professional.',
          {
            x: 50,
            y: 40,
            size: 8,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
          },
        );
      }

      const pdfBytes = await pdfDoc.save();
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
}

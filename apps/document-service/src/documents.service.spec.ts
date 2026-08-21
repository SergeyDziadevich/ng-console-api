import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DocumentsService } from './documents.service';
import { Document, DocumentChunk } from '@ng-console-api/database';
import { KafkaProducerService } from '@ng-console-api/common';
import { KAFKA_TOPICS } from '@ng-console-api/contracts';

describe('DocumentsService', () => {
  let service: DocumentsService;

  const mockDocModel: {
    create: jest.Mock;
    find: jest.Mock;
    findById: jest.Mock;
    findOne: jest.Mock;
  } = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
  };

  const mockChunkModel: {
    create: jest.Mock;
    find: jest.Mock;
  } = {
    create: jest.fn(),
    find: jest.fn(),
  };

  const mockKafkaProducer: {
    emit: jest.Mock;
  } = {
    emit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getModelToken(Document.name),
          useValue: mockDocModel,
        },
        {
          provide: getModelToken(DocumentChunk.name),
          useValue: mockChunkModel,
        },
        {
          provide: KafkaProducerService,
          useValue: mockKafkaProducer,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('upload', () => {
    it('should create document and chunk, emit audit log', async () => {
      const mockDoc = {
        _id: 'doc-mongo-1',
        filename: 'contract.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        storageKey: 'docs/owner-1/contract.pdf',
        uploadedBy: 'owner-1',
        status: 'DRAFT',
      };

      mockDocModel.create.mockResolvedValue(mockDoc);
      mockChunkModel.create.mockResolvedValue({ _id: 'chunk-1' });

      const result = await service.upload({
        title: 'Contract PDF',
        filename: 'contract.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        bufferBase64: 'AAAA',
        ownerId: 'owner-1',
      });

      expect(result.id).toBe('doc-mongo-1');
      expect(result.filename).toBe('contract.pdf');
      expect(mockChunkModel.create).toHaveBeenCalled();
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.AUDIT_LOGS,
        expect.objectContaining({
          action: 'DOCUMENT_UPLOADED',
          entityId: 'doc-mongo-1',
        }),
        'doc-mongo-1',
      );
    });
  });

  describe('signDocument', () => {
    it('should sign document and emit document.signed and email.notification events', async () => {
      const mockDoc = {
        _id: 'doc-mongo-1',
        filename: 'contract.pdf',
        storageKey: 'docs/owner-1/contract.pdf',
        isSigned: false,
        partyASignatureName: undefined,
        status: 'DRAFT',
        signedAt: undefined,
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockDocModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      const result = await service.signDocument({
        documentId: 'doc-mongo-1',
        signerEmail: 'signer@example.com',
        signatureBase64: 'SIGNDATA',
      });

      expect(result.isSigned).toBe(true);
      expect(mockDoc.save).toHaveBeenCalled();
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.DOCUMENT_SIGNED,
        expect.objectContaining({
          documentId: 'doc-mongo-1',
          signerEmail: 'signer@example.com',
        }),
        'doc-mongo-1',
      );
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.EMAIL_NOTIFICATION,
        expect.objectContaining({
          to: 'signer@example.com',
          subject: 'Signed Document: contract.pdf',
        }),
      );
    });
  });
});

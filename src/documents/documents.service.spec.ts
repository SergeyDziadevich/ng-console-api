import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { AiService } from '../ai/ai.service';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditProducerService } from '../audit/audit-producer.service';
import { Document } from '../schemas/document.schema';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

// Mock @google-cloud/storage
jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: jest.fn().mockReturnValue({
      file: jest.fn().mockReturnValue({
        save: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
        download: jest.fn().mockResolvedValue([Buffer.from('fake')]),
        createReadStream: jest.fn(),
      }),
    }),
  })),
}));

// Mock pdf-lib
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    load: jest.fn().mockResolvedValue({
      embedFont: jest.fn().mockResolvedValue({
        widthOfTextAtSize: jest.fn().mockReturnValue(100),
      }),
      getPages: jest.fn().mockReturnValue([
        {
          drawText: jest.fn(),
          drawImage: jest.fn(),
        },
      ]),
      embedPng: jest.fn().mockResolvedValue({
        scale: jest.fn().mockReturnValue({ width: 50, height: 20 }),
      }),
      save: jest.fn().mockResolvedValue(new Uint8Array([1, 2])),
    }),
  },
  StandardFonts: { HelveticaBold: 'Helvetica-Bold' },
  rgb: jest.fn(),
}));

describe('DocumentsService', () => {
  let service: DocumentsService;

  const mockExec = jest.fn();

  // Define a type for our mock model
  type MockModel = {
    find: jest.Mock;
    countDocuments: jest.Mock;
    findById: jest.Mock;
    findByIdAndDelete: jest.Mock;
    findOne: jest.Mock;
  };

  let mockDocumentModel: MockModel;

  beforeEach(async () => {
    mockDocumentModel = {
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                exec: mockExec,
              }),
            }),
          }),
        }),
      }),
      countDocuments: jest.fn().mockReturnValue({ exec: mockExec }),
      findById: jest.fn().mockReturnValue({ exec: mockExec }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: mockExec }),
      findOne: jest.fn().mockReturnValue({ exec: mockExec }),
    };

    const modelConstructor = jest
      .fn()
      .mockImplementation((dto: Partial<Document>) => ({
        ...dto,
        _id: 'new-id',
        save: jest.fn().mockResolvedValue({ ...dto, _id: 'new-id' }),
      }));

    Object.assign(modelConstructor, mockDocumentModel);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getModelToken(Document.name),
          useValue: modelConstructor,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock-bucket') },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: AuditProducerService,
          useValue: { logAction: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: getModelToken('DocumentChunk'),
          useValue: {},
        },
        {
          provide: AiService,
          useValue: { embedText: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDocumentById', () => {
    it('should return a document if found', async () => {
      const mockDoc = { _id: 'doc-id' };
      mockExec.mockResolvedValueOnce(mockDoc);

      const result = await service.getDocumentById('doc-id');
      expect(result).toEqual(mockDoc);
    });

    it('should throw NotFoundException if not found', async () => {
      mockExec.mockResolvedValueOnce(null);

      await expect(service.getDocumentById('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      const mockDoc = {
        _id: 'doc-id',
        storageKey: 'path/to/file',
        filename: 'file.pdf',
      };
      mockExec.mockResolvedValueOnce(mockDoc); // getDocumentById mock
      mockExec.mockResolvedValueOnce(mockDoc); // findByIdAndDelete mock

      await expect(
        service.deleteDocument('doc-id', 'user-1'),
      ).resolves.toBeUndefined();
      expect(mockDocumentModel.findByIdAndDelete).toHaveBeenCalledWith(
        'doc-id',
      );
    });
  });

  describe('signDocument', () => {
    it('should throw ForbiddenException if user has no permission', async () => {
      const mockDoc = {
        _id: 'doc-id',
        uploadedBy: { toString: () => 'user-1' },
        mimeType: 'application/pdf',
      };
      mockExec.mockResolvedValueOnce(mockDoc);

      await expect(
        service.signDocument('doc-id', 'user-2', 'User Two', 'user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if not PDF', async () => {
      const mockDoc = {
        _id: 'doc-id',
        uploadedBy: { toString: () => 'user-1' },
        mimeType: 'image/png',
      };
      mockExec.mockResolvedValueOnce(mockDoc);

      await expect(
        service.signDocument('doc-id', 'user-1', 'User One', 'user'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already signed', async () => {
      const mockDoc = {
        _id: 'doc-id',
        uploadedBy: { toString: () => 'user-1' },
        mimeType: 'application/pdf',
        isSigned: true,
      };
      mockExec.mockResolvedValueOnce(mockDoc);

      await expect(
        service.signDocument('doc-id', 'user-1', 'User One', 'user'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

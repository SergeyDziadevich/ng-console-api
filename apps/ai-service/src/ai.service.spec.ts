import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { KafkaProducerService } from '@ng-console-api/common';
import { KAFKA_TOPICS } from '@ng-console-api/contracts';

describe('AiService', () => {
  let service: AiService;

  const mockConfigService: { get: jest.Mock } = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'GEMINI_API_KEY') return 'test-gemini-key';
      return null;
    }),
  };

  const mockKafkaProducer: { emit: jest.Mock } = {
    emit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: KafkaProducerService,
          useValue: mockKafkaProducer,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  describe('generate', () => {
    it('should generate reasoning response and emit audit log', async () => {
      const result = await service.generate({
        prompt: 'Check the open tickets for me',
        userId: 'user-1',
      });

      expect(result.response).toBeDefined();
      expect(result.toolsUsed).toContain('getTicketsTool');
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.AUDIT_LOGS,
        expect.objectContaining({
          action: 'AI_PROMPT_GENERATED',
          authorId: 'user-1',
        }),
        'user-1',
      );
    });
  });

  describe('getFilesAnalytics', () => {
    it('should return files analytics payload', async () => {
      const result = await service.getFilesAnalytics({ userId: 'user-1' });
      expect(result.totalFiles).toBeGreaterThan(0);
      expect(result.signedDocuments).toBeGreaterThanOrEqual(0);
    });
  });
});

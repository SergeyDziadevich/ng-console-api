import { Test, TestingModule } from '@nestjs/testing';
import { AuditConsumerController } from './audit-consumer.controller';
import { AuditService } from './audit.service';
import { AuditLogEvent } from '@ng-console-api/contracts';

describe('AuditConsumerController', () => {
  let controller: AuditConsumerController;

  const mockAuditService: {
    logEvent: jest.Mock;
  } = {
    logEvent: jest.fn().mockResolvedValue({ id: 'audit-123' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditConsumerController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditConsumerController>(AuditConsumerController);
  });

  describe('handleAuditLog', () => {
    it('should process valid audit event', async () => {
      const event: AuditLogEvent = {
        action: 'user.login',
        authorId: 'usr-1',
        entityType: 'auth',
        metadata: { ip: '127.0.0.1' },
        createdAt: '2026-08-20T00:00:00.000Z',
      };

      await controller.handleAuditLog(event);
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(event);
    });

    it('should safely handle null/undefined event without throwing', async () => {
      const nullEvent = null as unknown as AuditLogEvent;
      await expect(
        controller.handleAuditLog(nullEvent),
      ).resolves.toBeUndefined();
      expect(mockAuditService.logEvent).not.toHaveBeenCalled();
    });

    it('should safely ignore malformed event without action', async () => {
      const invalidEvent = { authorId: 'usr-1' } as unknown as AuditLogEvent;
      await expect(
        controller.handleAuditLog(invalidEvent),
      ).resolves.toBeUndefined();
      expect(mockAuditService.logEvent).not.toHaveBeenCalled();
    });
  });
});

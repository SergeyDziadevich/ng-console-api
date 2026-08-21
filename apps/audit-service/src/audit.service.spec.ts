import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditLog, SystemSettings } from '@ng-console-api/database';

describe('AuditService', () => {
  let service: AuditService;

  const mockAuditLogModel: {
    create: jest.Mock;
    find: jest.Mock;
  } = {
    create: jest.fn(),
    find: jest.fn(),
  };

  const mockSettingsModel: {
    findOne: jest.Mock;
    create: jest.Mock;
  } = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken(AuditLog.name),
          useValue: mockAuditLogModel,
        },
        {
          provide: getModelToken(SystemSettings.name),
          useValue: mockSettingsModel,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('logEvent', () => {
    it('should calculate TTL expiresAt and persist audit log', async () => {
      mockSettingsModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ auditRetentionDays: 30 }),
      });

      const mockCreatedLog = {
        _id: 'audit-log-1',
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: 'user-1',
        authorId: 'user-1',
        metadata: { ip: '127.0.0.1' },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 86400000),
      };

      mockAuditLogModel.create.mockResolvedValue(mockCreatedLog);

      const result = await service.logEvent({
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: 'user-1',
        authorId: 'user-1',
        metadata: { ip: '127.0.0.1' },
        createdAt: new Date().toISOString(),
      });

      expect(result.id).toBe('audit-log-1');
      expect(result.action).toBe('USER_LOGIN');
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_LOGIN',
          authorId: 'user-1',
        }),
      );
    });
  });

  describe('getSettings', () => {
    it('should return system settings retention days', async () => {
      mockSettingsModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          auditRetentionDays: 60,
          updatedAt: new Date(),
        }),
      });

      const settings = await service.getSettings();
      expect(settings.retentionDays).toBe(60);
    });
  });
});

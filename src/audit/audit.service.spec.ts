import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { getModelToken } from '@nestjs/mongoose';
import { AuditLog } from '../schemas/audit-log.schema';
import { SystemSettingsService } from './system-settings.service';

describe('AuditService', () => {
  let service: AuditService;

  const mockLogs = [
    {
      action: 'CREATE',
      entityType: 'User',
      authorId: 'user1',
      createdAt: new Date(),
    },
    {
      action: 'UPDATE',
      entityType: 'Ticket',
      authorId: 'user2',
      createdAt: new Date(),
    },
  ];

  const mockQuery = {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(mockLogs),
  };

  const mockCount = {
    exec: jest.fn().mockResolvedValue(2),
  };

  const mockDistinct = {
    exec: jest.fn().mockResolvedValue(['CREATE', 'UPDATE']),
  };

  const mockAuditLogModel = {
    find: jest.fn().mockReturnValue(mockQuery),
    countDocuments: jest.fn().mockReturnValue(mockCount),
    distinct: jest.fn().mockReturnValue(mockDistinct),
  };

  const mockSystemSettingsService = {
    getAuditRetentionDays: jest.fn().mockResolvedValue(30),
    setAuditRetentionDays: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken(AuditLog.name),
          useValue: mockAuditLogModel,
        },
        {
          provide: SystemSettingsService,
          useValue: mockSystemSettingsService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLogs', () => {
    it('should return paginated logs with default parameters', async () => {
      const result = await service.getLogs({});

      expect(mockAuditLogModel.find).toHaveBeenCalledWith({});
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(50);
      expect(mockAuditLogModel.countDocuments).toHaveBeenCalledWith({});
      expect(result).toEqual({
        items: mockLogs,
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
      });
    });

    it('should query with search parameter', async () => {
      await service.getLogs({ search: 'test' });

      const expectedQuery = {
        $or: [
          { action: { $regex: 'test', $options: 'i' } },
          { entityType: { $regex: 'test', $options: 'i' } },
          { authorId: { $regex: 'test', $options: 'i' } },
        ],
      };
      expect(mockAuditLogModel.find).toHaveBeenCalledWith(expectedQuery);
      expect(mockAuditLogModel.countDocuments).toHaveBeenCalledWith(
        expectedQuery,
      );
    });

    it('should query with actions filter', async () => {
      await service.getLogs({ actions: ['CREATE', 'DELETE'] });

      const expectedQuery = {
        action: { $in: ['CREATE', 'DELETE'] },
      };
      expect(mockAuditLogModel.find).toHaveBeenCalledWith(expectedQuery);
    });

    it('should query with date ranges', async () => {
      const startDate = '2026-01-01';
      const endDate = '2026-01-02';
      await service.getLogs({ startDate, endDate });

      const expectedQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: expect.any(Date) as unknown as Date,
        },
      };
      expect(mockAuditLogModel.find).toHaveBeenCalledWith(expectedQuery);
    });
  });

  describe('getAvailableActions', () => {
    it('should return distinct actions', async () => {
      const result = await service.getAvailableActions();

      expect(mockAuditLogModel.distinct).toHaveBeenCalledWith('action');
      expect(mockDistinct.exec).toHaveBeenCalled();
      expect(result).toEqual(['CREATE', 'UPDATE']);
    });
  });

  describe('getRetentionDays', () => {
    it('should return the current retention settings', async () => {
      const result = await service.getRetentionDays();

      expect(
        mockSystemSettingsService.getAuditRetentionDays,
      ).toHaveBeenCalled();
      expect(result).toEqual({ retentionDays: 30 });
    });
  });

  describe('setRetentionDays', () => {
    it('should set retention settings and return success', async () => {
      const result = await service.setRetentionDays(45);

      expect(
        mockSystemSettingsService.setAuditRetentionDays,
      ).toHaveBeenCalledWith(45);
      expect(result).toEqual({ success: true, retentionDays: 45 });
    });
  });
});

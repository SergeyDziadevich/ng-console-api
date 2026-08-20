import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { Post, User, UserSettings } from '@ng-console-api/database';
import { KafkaProducerService } from '@ng-console-api/common';
import { KAFKA_TOPICS } from '@ng-console-api/contracts';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserModel: {
    find: jest.Mock;
    findById: jest.Mock;
    findOne: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    deleteOne: jest.Mock;
    create: jest.Mock;
  } = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    create: jest.fn(),
  };

  const mockUserSettingsModel: {
    findByIdAndUpdate: jest.Mock;
    create: jest.Mock;
  } = {
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
  };

  const mockPostModel: {
    create: jest.Mock;
  } = {
    create: jest.fn(),
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
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(UserSettings.name),
          useValue: mockUserSettingsModel,
        },
        {
          provide: getModelToken(Post.name),
          useValue: mockPostModel,
        },
        {
          provide: KafkaProducerService,
          useValue: mockKafkaProducer,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('createUser', () => {
    it('should create user and publish user.created and audit-logs events to Kafka', async () => {
      const mockCreatedUser = {
        _id: 'user-mongo-id-123',
        email: 'alice@example.com',
        username: 'alice',
        role: 'user',
        isTwoFactorEnabled: false,
      };

      mockUserModel.create.mockResolvedValue(mockCreatedUser);

      const result = await service.createUser({
        email: 'alice@example.com',
        username: 'alice',
        password: 'Password123!',
      });

      expect(result.id).toBe('user-mongo-id-123');
      expect(result.email).toBe('alice@example.com');
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_CREATED,
        expect.objectContaining({
          userId: 'user-mongo-id-123',
          email: 'alice@example.com',
        }),
        'user-mongo-id-123',
      );
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.AUDIT_LOGS,
        expect.objectContaining({
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: 'user-mongo-id-123',
        }),
        'user-mongo-id-123',
      );
    });
  });

  describe('findById', () => {
    it('should return user DTO if found', async () => {
      const mockUser = {
        _id: 'user-mongo-id-123',
        email: 'alice@example.com',
        username: 'alice',
        role: 'user',
        isTwoFactorEnabled: false,
      };

      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUser),
          }),
        }),
      });

      const result = await service.findById('user-mongo-id-123');
      expect(result.id).toBe('user-mongo-id-123');
      expect(result.email).toBe('alice@example.com');
    });
  });

  describe('deleteUser', () => {
    it('should delete user and emit audit log event', async () => {
      mockUserModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      const result = await service.deleteUser('user-mongo-id-123');
      expect(result.deleted).toBe(true);
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.AUDIT_LOGS,
        expect.objectContaining({
          action: 'USER_DELETED',
          entityId: 'user-mongo-id-123',
        }),
        'user-mongo-id-123',
      );
    });
  });
});

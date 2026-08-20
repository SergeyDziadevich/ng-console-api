import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatMessage, ChatRoom, ChatRoomMember } from '@ng-console-api/database';
import { KafkaProducerService } from '@ng-console-api/common';
import { KAFKA_TOPICS } from '@ng-console-api/contracts';

describe('ChatService', () => {
  let service: ChatService;

  const mockRoomRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
    remove: jest.Mock;
  } = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };

  const mockMemberRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  } = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockMessageRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  } = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockKafkaProducer: { emit: jest.Mock } = {
    emit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatRoom),
          useValue: mockRoomRepo,
        },
        {
          provide: getRepositoryToken(ChatRoomMember),
          useValue: mockMemberRepo,
        },
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: mockMessageRepo,
        },
        {
          provide: KafkaProducerService,
          useValue: mockKafkaProducer,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('createRoom', () => {
    it('should create room, add members, and emit audit log', async () => {
      const mockRoom = {
        id: 'room-uuid-1',
        name: 'General',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockMember = {
        id: 'member-1',
        roomId: 'room-uuid-1',
        userId: 'user-1',
        joinedAt: new Date(),
      };

      mockRoomRepo.create.mockReturnValue(mockRoom);
      mockRoomRepo.save.mockResolvedValue(mockRoom);
      mockMemberRepo.create.mockReturnValue(mockMember);
      mockMemberRepo.save.mockResolvedValue(mockMember);

      const result = await service.createRoom({
        name: 'General',
        isDirect: false,
        createdBy: 'user-1',
        memberIds: ['user-1'],
      });

      expect(result.id).toBe('room-uuid-1');
      expect(result.name).toBe('General');
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.AUDIT_LOGS,
        expect.objectContaining({
          action: 'CHAT_ROOM_CREATED',
          entityId: 'room-uuid-1',
        }),
        'room-uuid-1',
      );
    });
  });

  describe('sendMessage', () => {
    it('should save and return message', async () => {
      const mockRoom = { id: 'room-1', name: 'General' };
      const mockMessage = {
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        content: 'Hello team',
        createdAt: new Date(),
      };

      mockRoomRepo.findOneBy.mockResolvedValue(mockRoom);
      mockMessageRepo.create.mockReturnValue(mockMessage);
      mockMessageRepo.save.mockResolvedValue(mockMessage);

      const result = await service.sendMessage({
        roomId: 'room-1',
        senderId: 'user-1',
        content: 'Hello team',
      });

      expect(result.id).toBe('msg-1');
      expect(result.content).toBe('Hello team');
    });
  });
});

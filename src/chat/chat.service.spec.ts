import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { UsersService } from '../users/users.service';
import { NotFoundException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;
  let roomRepoMock: Record<string, jest.Mock>;
  let memberRepoMock: Record<string, jest.Mock>;
  let messageRepoMock: Record<string, jest.Mock>;
  let usersServiceMock: Record<string, jest.Mock>;

  beforeEach(async () => {
    roomRepoMock = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    memberRepoMock = {
      delete: jest.fn(),
    };
    messageRepoMock = {
      delete: jest.fn(),
    };
    usersServiceMock = {
      getUserById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatRoom),
          useValue: roomRepoMock,
        },
        {
          provide: getRepositoryToken(ChatRoomMember),
          useValue: memberRepoMock,
        },
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: messageRepoMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteRoom', () => {
    it('should successfully delete a room and its associations', async () => {
      const roomId = 'room-123';
      const mockRoom = { id: roomId, name: 'Room 1' };

      roomRepoMock.findOne.mockResolvedValue(mockRoom);
      memberRepoMock.delete.mockResolvedValue({ affected: 1 });
      messageRepoMock.delete.mockResolvedValue({ affected: 1 });
      roomRepoMock.delete.mockResolvedValue({ affected: 1 });

      await expect(service.deleteRoom(roomId)).resolves.not.toThrow();

      expect(roomRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: roomId },
      });
      expect(memberRepoMock.delete).toHaveBeenCalledWith({ roomId });
      expect(messageRepoMock.delete).toHaveBeenCalledWith({ roomId });
      expect(roomRepoMock.delete).toHaveBeenCalledWith({ id: roomId });
    });

    it('should throw NotFoundException if room does not exist', async () => {
      const roomId = 'room-nonexistent';
      roomRepoMock.findOne.mockResolvedValue(null);

      await expect(service.deleteRoom(roomId)).rejects.toThrow(
        NotFoundException,
      );
      expect(roomRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: roomId },
      });
      expect(roomRepoMock.delete).not.toHaveBeenCalled();
    });
  });

  describe('renameRoom', () => {
    it('should successfully rename a room and return room details', async () => {
      const roomId = 'room-123';
      const newName = 'New Name';
      const mockRoom = {
        id: roomId,
        name: 'Old Name',
        members: [{ userId: 'user-1' }],
      };
      const enrichedRoom = {
        id: roomId,
        name: newName,
        members: [{ userId: 'user-1', username: 'user1' }],
      };

      roomRepoMock.findOne.mockResolvedValueOnce(mockRoom);
      roomRepoMock.save.mockResolvedValue({ ...mockRoom, name: newName });

      roomRepoMock.findOne.mockResolvedValueOnce({
        ...mockRoom,
        name: newName,
      });
      usersServiceMock.getUserById.mockResolvedValue({ username: 'user1' });

      const result = await service.renameRoom(roomId, newName);

      expect(result.name).toBe(newName);
      expect(roomRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: newName }),
      );
      expect(usersServiceMock.getUserById).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundException if room does not exist when renaming', async () => {
      const roomId = 'room-nonexistent';
      roomRepoMock.findOne.mockResolvedValue(null);

      await expect(service.renameRoom(roomId, 'New Name')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { UsersService } from '../users/users.service';

export interface RoomMemberDetails {
  userId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface RoomDetails extends Omit<ChatRoom, 'members'> {
  members: RoomMemberDetails[];
}

export interface EnhancedMessage extends ChatMessage {
  senderName?: string;
  senderDisplayName?: string;
  senderAvatarUrl?: string;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private roomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatRoomMember)
    private memberRepository: Repository<ChatRoomMember>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    private usersService: UsersService,
  ) {}

  async createRoom(
    name: string,
    invitedUserIds: string[],
    creatorId: string,
  ): Promise<RoomDetails> {
    const allMemberIds = Array.from(new Set([...invitedUserIds, creatorId]));

    const room = this.roomRepository.create({ name });
    await this.roomRepository.save(room);

    const members = allMemberIds.map((userId) =>
      this.memberRepository.create({ roomId: room.id, userId }),
    );
    await this.memberRepository.save(members);

    return this.getRoomDetails(room.id);
  }

  async addMembersToRoom(
    roomId: string,
    newUserIds: string[],
    requesterId: string,
  ): Promise<RoomDetails> {
    const isRequesterMember = await this.isRoomMember(roomId, requesterId);
    if (!isRequesterMember) {
      throw new ForbiddenException('Not a member of this room');
    }

    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: { members: true },
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const existingUserIds = new Set(room.members.map(m => m.userId));
    const membersToAdd = newUserIds.filter(id => !existingUserIds.has(id));

    if (membersToAdd.length > 0) {
      const newMembers = membersToAdd.map(userId =>
        this.memberRepository.create({ roomId, userId })
      );
      await this.memberRepository.save(newMembers);
    }

    return this.getRoomDetails(roomId);
  }

  async getRoomsForUser(userId: string): Promise<RoomDetails[]> {
    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: { room: true },
    });

    const roomIds = memberships.map((m) => m.room.id);
    if (roomIds.length === 0) return [];

    const rooms = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.members', 'members')
      .where('room.id IN (:...roomIds)', { roomIds })
      .getMany();

    return Promise.all(rooms.map((room) => this.enrichRoomWithUsers(room)));
  }

  async getMessagesForRoom(
    roomId: string,
    userId: string,
  ): Promise<EnhancedMessage[]> {
    const isMember = await this.isRoomMember(roomId, userId);
    if (!isMember) {
      throw new ForbiddenException('Not a member of this room');
    }

    const messages = await this.messageRepository.find({
      where: { roomId },
      order: { createdAt: 'ASC' },
    });

    return Promise.all(
      messages.map(async (msg) => {
        const user = await this.usersService.getUserById(msg.senderId);
        return {
          ...msg,
          senderName: user?.username,
          senderDisplayName: user?.displayName,
          senderAvatarUrl: user?.avatarUrl,
        };
      }),
    );
  }

  async saveMessage(
    roomId: string,
    senderId: string,
    content: string,
  ): Promise<ChatMessage> {
    const isMember = await this.isRoomMember(roomId, senderId);
    if (!isMember) {
      throw new ForbiddenException('Not a member of this room');
    }

    const message = this.messageRepository.create({
      roomId,
      senderId,
      content,
    });
    return this.messageRepository.save(message);
  }

  async isRoomMember(roomId: string, userId: string): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { roomId, userId },
    });
    return !!member;
  }

  async getRoomDetails(roomId: string): Promise<RoomDetails> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: { members: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    return this.enrichRoomWithUsers(room);
  }

  private async enrichRoomWithUsers(room: ChatRoom): Promise<RoomDetails> {
    const membersWithDetails = await Promise.all(
      room.members.map(async (member) => {
        const user = await this.usersService.getUserById(member.userId);
        return {
          userId: member.userId,
          username: user?.username,
          displayName: user?.displayName,
          avatarUrl: user?.avatarUrl,
        };
      }),
    );
    return {
      ...room,
      members: membersWithDetails,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ChatMessage,
  ChatRoom,
  ChatRoomMember,
} from '@ng-console-api/database';
import {
  AddMemberCommand,
  ChatMessageDto,
  ChatRoomDto,
  CreateRoomCommand,
  GetMessagesCommand,
  KAFKA_TOPICS,
  SendMessageCommand,
} from '@ng-console-api/contracts';
import { KafkaProducerService } from '@ng-console-api/common';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly roomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatRoomMember)
    private readonly memberRepo: Repository<ChatRoomMember>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createRoom(cmd: CreateRoomCommand): Promise<ChatRoomDto> {
    const room = this.roomRepo.create({
      name: cmd.name,
    });
    const savedRoom = await this.roomRepo.save(room);

    const members: ChatRoomMember[] = [];
    for (const userId of cmd.memberIds) {
      const member = this.memberRepo.create({
        roomId: savedRoom.id,
        userId,
        room: savedRoom,
      });
      members.push(await this.memberRepo.save(member));
    }

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'CHAT_ROOM_CREATED',
        entityType: 'ChatRoom',
        entityId: savedRoom.id,
        authorId: cmd.createdBy,
        metadata: { name: savedRoom.name },
        createdAt: new Date().toISOString(),
      },
      savedRoom.id,
    );

    return this.mapToRoomDto(savedRoom, members, cmd.createdBy, cmd.isDirect);
  }

  async getRooms(userId: string): Promise<ChatRoomDto[]> {
    const members = await this.memberRepo.find({
      where: { userId },
      relations: { room: true },
    });

    const roomIds = members.map((m) => m.roomId);
    if (roomIds.length === 0) {
      return [];
    }

    const rooms = await this.roomRepo.find({
      where: roomIds.map((id) => ({ id })),
      relations: { members: true, messages: true },
    });

    return rooms.map((r) => this.mapToRoomDto(r, r.members, userId, false));
  }

  async addMember(cmd: AddMemberCommand): Promise<{ success: boolean }> {
    const room = await this.roomRepo.findOneBy({ id: cmd.roomId });
    if (!room) {
      throw new NotFoundException(`Room ${cmd.roomId} not found`);
    }

    const member = this.memberRepo.create({
      roomId: cmd.roomId,
      userId: cmd.userId,
      room,
    });
    await this.memberRepo.save(member);

    return { success: true };
  }

  async getMessages(cmd: GetMessagesCommand): Promise<ChatMessageDto[]> {
    const messages = await this.messageRepo.find({
      where: { roomId: cmd.roomId },
      order: { createdAt: 'DESC' },
      take: cmd.limit || 50,
      skip: cmd.offset || 0,
    });

    return messages.map((m) => ({
      id: m.id,
      roomId: m.roomId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async sendMessage(cmd: SendMessageCommand): Promise<ChatMessageDto> {
    const room = await this.roomRepo.findOneBy({ id: cmd.roomId });
    if (!room) {
      throw new NotFoundException(`Room ${cmd.roomId} not found`);
    }

    const message = this.messageRepo.create({
      roomId: cmd.roomId,
      senderId: cmd.senderId,
      content: cmd.content,
      room,
    });
    const saved = await this.messageRepo.save(message);

    return {
      id: saved.id,
      roomId: saved.roomId,
      senderId: saved.senderId,
      content: saved.content,
      attachments: cmd.attachments,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async deleteRoom(roomId: string): Promise<{ success: boolean }> {
    const room = await this.roomRepo.findOneBy({ id: roomId });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    await this.roomRepo.remove(room);
    return { success: true };
  }

  private mapToRoomDto(
    room: ChatRoom,
    members: ChatRoomMember[],
    createdBy: string,
    isDirect: boolean,
  ): ChatRoomDto {
    return {
      id: room.id,
      name: room.name,
      isDirect,
      createdBy,
      members: members.map((m) => ({
        id: m.id,
        roomId: m.roomId,
        userId: m.userId,
        role: 'member',
        joinedAt: m.joinedAt?.toISOString() || new Date().toISOString(),
      })),
      createdAt: room.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: room.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}

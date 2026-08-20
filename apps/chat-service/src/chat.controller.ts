import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  AddMemberCommand,
  ChatMessageDto,
  ChatRoomDto,
  CHAT_PATTERNS,
  CreateRoomCommand,
  GetMessagesCommand,
  SendMessageCommand,
} from '@ng-console-api/contracts';
import { ChatService } from './chat.service';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @MessagePattern(CHAT_PATTERNS.CREATE_ROOM)
  async createRoom(@Payload() data: CreateRoomCommand): Promise<ChatRoomDto> {
    try {
      return await this.chatService.createRoom(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Create room failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(CHAT_PATTERNS.GET_ROOMS)
  async getRooms(@Payload() data: { userId: string }): Promise<ChatRoomDto[]> {
    return this.chatService.getRooms(data.userId);
  }

  @MessagePattern(CHAT_PATTERNS.ADD_MEMBER)
  async addMember(
    @Payload() data: AddMemberCommand,
  ): Promise<{ success: boolean }> {
    try {
      return await this.chatService.addMember(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Add member failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(CHAT_PATTERNS.GET_MESSAGES)
  async getMessages(
    @Payload() data: GetMessagesCommand,
  ): Promise<ChatMessageDto[]> {
    return this.chatService.getMessages(data);
  }

  @MessagePattern(CHAT_PATTERNS.SEND_MESSAGE)
  async sendMessage(
    @Payload() data: SendMessageCommand,
  ): Promise<ChatMessageDto> {
    try {
      return await this.chatService.sendMessage(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Send message failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(CHAT_PATTERNS.DELETE_ROOM)
  async deleteRoom(
    @Payload() data: { roomId: string },
  ): Promise<{ success: boolean }> {
    try {
      return await this.chatService.deleteRoom(data.roomId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete room failed';
      throw new RpcException({ statusCode: 404, message });
    }
  }
}

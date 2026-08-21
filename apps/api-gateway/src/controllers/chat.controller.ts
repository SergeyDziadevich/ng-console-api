import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AddMemberCommand,
  ChatMessageDto,
  ChatRoomDto,
  CHAT_PATTERNS,
  CreateRoomCommand,
  GetMessagesCommand,
  MICROSERVICE_SERVICES,
  SendMessageCommand,
} from '@ng-console-api/contracts';
import { CurrentUser, JwtAuthGuard, UserContext } from '@ng-console-api/common';
import { AddMemberDto, CreateRoomDto, SendMessageDto } from '../dto/chat.dto';

@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatGatewayController {
  constructor(
    @Inject(MICROSERVICE_SERVICES.CHAT_SERVICE)
    private readonly chatClient: ClientProxy,
  ) {}

  @Get('rooms')
  async getRooms(@CurrentUser() user: UserContext): Promise<ChatRoomDto[]> {
    return firstValueFrom(
      this.chatClient.send<ChatRoomDto[], { userId: string }>(
        CHAT_PATTERNS.GET_ROOMS,
        { userId: user.id },
      ),
    );
  }

  @Post('rooms')
  async createRoom(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateRoomDto,
  ): Promise<ChatRoomDto> {
    const memberIds = dto.memberIds || [];
    if (!memberIds.includes(user.id)) {
      memberIds.push(user.id);
    }
    const payload: CreateRoomCommand = {
      name: dto.name,
      isDirect: dto.isDirect ?? false,
      createdBy: user.id,
      memberIds,
    };
    return firstValueFrom(
      this.chatClient.send<ChatRoomDto, CreateRoomCommand>(
        CHAT_PATTERNS.CREATE_ROOM,
        payload,
      ),
    );
  }

  @Post('rooms/:roomId/members')
  async addMember(
    @Param('roomId') roomId: string,
    @Body() dto: AddMemberDto,
  ): Promise<{ success: boolean }> {
    const payload: AddMemberCommand = {
      roomId,
      userId: dto.userId,
      role: dto.role,
    };
    return firstValueFrom(
      this.chatClient.send<{ success: boolean }, AddMemberCommand>(
        CHAT_PATTERNS.ADD_MEMBER,
        payload,
      ),
    );
  }

  @Get('rooms/:roomId/messages')
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<ChatMessageDto[]> {
    const payload: GetMessagesCommand = {
      roomId,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    };
    return firstValueFrom(
      this.chatClient.send<ChatMessageDto[], GetMessagesCommand>(
        CHAT_PATTERNS.GET_MESSAGES,
        payload,
      ),
    );
  }

  @Post('rooms/:roomId/messages')
  async sendMessage(
    @Param('roomId') roomId: string,
    @CurrentUser() user: UserContext,
    @Body() dto: SendMessageDto,
  ): Promise<ChatMessageDto> {
    const payload: SendMessageCommand = {
      roomId,
      senderId: user.id,
      content: dto.content,
      attachments: dto.attachments,
    };
    return firstValueFrom(
      this.chatClient.send<ChatMessageDto, SendMessageCommand>(
        CHAT_PATTERNS.SEND_MESSAGE,
        payload,
      ),
    );
  }

  @Delete('rooms/:roomId')
  async deleteRoom(
    @Param('roomId') roomId: string,
  ): Promise<{ success: boolean }> {
    return firstValueFrom(
      this.chatClient.send<{ success: boolean }, { roomId: string }>(
        CHAT_PATTERNS.DELETE_ROOM,
        { roomId },
      ),
    );
  }
}

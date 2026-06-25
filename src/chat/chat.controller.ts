import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService, RoomDetails, EnhancedMessage } from './chat.service';
import { AuthGuard } from '../auth/auth.guard';
import { JwtPayload } from '../auth/models/auth.interface';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: JwtPayload;
}

@Controller('chats')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  getRooms(@Request() req: AuthenticatedRequest): Promise<RoomDetails[]> {
    return this.chatService.getRoomsForUser(req.user.sub);
  }

  @Post('rooms')
  createRoom(
    @Request() req: AuthenticatedRequest,
    @Body() body: { name: string; invitedUserIds: string[] },
  ): Promise<RoomDetails> {
    return this.chatService.createRoom(
      body.name,
      body.invitedUserIds,
      req.user.sub,
    );
  }

  @Post('rooms/:roomId/members')
  addMembers(
    @Request() req: AuthenticatedRequest,
    @Param('roomId') roomId: string,
    @Body() body: { userIds: string[] },
  ): Promise<RoomDetails> {
    return this.chatService.addMembersToRoom(
      roomId,
      body.userIds,
      req.user.sub,
    );
  }

  @Get('rooms/:roomId/messages')
  getMessages(
    @Request() req: AuthenticatedRequest,
    @Param('roomId') roomId: string,
  ): Promise<EnhancedMessage[]> {
    return this.chatService.getMessagesForRoom(roomId, req.user.sub);
  }
}

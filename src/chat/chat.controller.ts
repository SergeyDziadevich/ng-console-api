import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ChatService, RoomDetails, EnhancedMessage } from './chat.service';
import { AuthGuard } from '../auth/auth.guard';
import { JwtPayload } from '../auth/models/auth.interface';
import { Request as ExpressRequest } from 'express';
import { Role } from '../users/enums/role.enum';

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

  @Delete('rooms/:roomId')
  deleteRoom(
    @Request() req: AuthenticatedRequest,
    @Param('roomId') roomId: string,
  ): Promise<void> {
    if (req.user.role !== Role.Admin && req.user.role !== Role.Moderator) {
      throw new ForbiddenException(
        'Only admins and moderators can delete rooms',
      );
    }
    return this.chatService.deleteRoom(roomId);
  }

  @Patch('rooms/:roomId')
  renameRoom(
    @Request() req: AuthenticatedRequest,
    @Param('roomId') roomId: string,
    @Body() body: { name: string },
  ): Promise<RoomDetails> {
    if (req.user.role !== Role.Admin && req.user.role !== Role.Moderator) {
      throw new ForbiddenException(
        'Only admins and moderators can rename rooms',
      );
    }
    return this.chatService.renameRoom(roomId, body.name);
  }
}

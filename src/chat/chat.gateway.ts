import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { JwtPayload } from '../auth/models/auth.interface';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      let token =
        (client.handshake.auth as { token?: string })?.token ||
        (client.handshake.query as { token?: string })?.token;
      if (!token && client.handshake.headers?.authorization) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }

      if (!token || typeof token !== 'string') {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.user = payload;

      // Join user to their rooms
      const rooms = await this.chatService.getRoomsForUser(payload.sub);
      rooms.forEach((room) => {
        void client.join(room.id);
      });

      console.log(
        `Client connected to chat: ${client.id} (User: ${payload.username})`,
      );
    } catch (err) {
      console.error('Chat websocket connection unauthorized', err);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    console.log(`Client disconnected from chat: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; content: string },
  ): Promise<void> {
    const user = client.user;
    if (!user) {
      return;
    }

    try {
      void client.join(data.roomId);
      const message = await this.chatService.saveMessage(
        data.roomId,
        user.sub,
        data.content,
      );

      const enhancedMessage = {
        ...message,
        senderName: user.username,
        senderDisplayName: user.displayName,
        senderAvatarUrl: user.avatarUrl,
      };

      this.server.to(data.roomId).emit('newMessage', enhancedMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    const user = client.user;
    if (!user) {
      return;
    }

    try {
      void client.join(data.roomId);
      await this.chatService.updateLastRead(data.roomId, user.sub);
      this.server.to(data.roomId).emit('readReceiptUpdated', {
        roomId: data.roomId,
        userId: user.sub,
        lastReadAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }
}

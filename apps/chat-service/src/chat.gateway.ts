import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

interface SocketMessagePayload {
  roomId: string;
  senderId: string;
  content: string;
  attachments?: string[];
}

interface SocketJoinPayload {
  roomId: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SocketJoinPayload,
  ): void {
    void client.join(payload.roomId);
    this.logger.log(`Client ${client.id} joined room ${payload.roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SocketMessagePayload,
  ): Promise<void> {
    const message = await this.chatService.sendMessage(payload);
    this.server.to(payload.roomId).emit('newMessage', message);
  }
}

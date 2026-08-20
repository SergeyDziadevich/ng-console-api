import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificationDto } from '@ng-console-api/contracts';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ): void {
    if (payload?.userId) {
      void client.join(`user:${payload.userId}`);
      this.logger.log(`Client ${client.id} subscribed to user:${payload.userId}`);
    }
  }

  sendToUser(userId: string, notification: NotificationDto): void {
    if (this.server) {
      this.server.to(`user:${userId}`).emit('notification', notification);
    }
  }

  broadcast(notification: NotificationDto): void {
    if (this.server) {
      this.server.emit('notification', notification);
    }
  }
}

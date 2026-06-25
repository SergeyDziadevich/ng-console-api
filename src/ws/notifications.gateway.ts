import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

export interface Notification {
  id: string;
  title: string;
  body: string;
  ts: number;
}

@WebSocketGateway({ connectionStateRecovery: {} })
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  broadcast(n: Notification) {
    this.server.emit('notification', n);
  }
}

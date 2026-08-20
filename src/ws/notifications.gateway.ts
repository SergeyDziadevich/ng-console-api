import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';

export interface Notification {
  id: string;
  title: string;
  body: string;
  ts: number;
  isSystem?: boolean;
  type?: string;
  userId?: string;
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

  @OnEvent('audit.log.created')
  handleAuditLogCreated(payload: unknown) {
    this.server.emit('new-audit-log', payload);
  }
}

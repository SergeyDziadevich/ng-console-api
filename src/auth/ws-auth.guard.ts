import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JwtPayload } from './models/auth.interface';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<Socket>();
      let token = client.handshake.auth?.token as string | undefined;

      if (!token) {
        const authHeader = client.handshake.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }

      if (!token) {
        const queryToken = client.handshake.query?.token;
        if (typeof queryToken === 'string') {
          token = queryToken;
        }
      }

      if (!token) {
        throw new WsException('Unauthorized');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.data = {
        ...(client.data as Record<string, unknown>),
        user: payload,
      };
      return true;
    } catch {
      throw new WsException('Unauthorized');
    }
  }
}

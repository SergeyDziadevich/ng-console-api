import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      id: string;
      email: string;
      username: string;
      role: string;
    };
  };
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const authHeader =
      client.handshake?.auth?.token ??
      client.handshake?.headers?.authorization ??
      (client.handshake?.query?.token as string | undefined);

    if (!authHeader) {
      throw new WsException('Unauthorized: No token provided');
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        username: payload.username ?? '',
        role: payload.role ?? 'USER',
      };
      return true;
    } catch {
      throw new WsException('Unauthorized: Invalid token');
    }
  }
}

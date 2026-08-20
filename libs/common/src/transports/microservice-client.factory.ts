import { ConfigService } from '@nestjs/config';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';

export const MICROSERVICE_SERVICES = {
  AUTH_SERVICE: 'AUTH_SERVICE',
  USER_SERVICE: 'USER_SERVICE',
  TICKET_SERVICE: 'TICKET_SERVICE',
  DOCUMENT_SERVICE: 'DOCUMENT_SERVICE',
  PAYMENT_SERVICE: 'PAYMENT_SERVICE',
  CHAT_SERVICE: 'CHAT_SERVICE',
  NOTIFICATION_SERVICE: 'NOTIFICATION_SERVICE',
  AUDIT_SERVICE: 'AUDIT_SERVICE',
  AI_SERVICE: 'AI_SERVICE',
  CUSTOMER_SERVICE: 'CUSTOMER_SERVICE',
} as const;

export function createMicroserviceClient(
  serviceName: string,
  configService: ConfigService,
  defaultPort: number = 4000,
): ClientProxy {
  const transportType = (
    configService.get<string>('MICROSERVICE_TRANSPORT') || 'tcp'
  ).toLowerCase();

  if (transportType === 'redis') {
    const host = configService.get<string>('REDIS_HOST', 'localhost');
    const port = Number(configService.get<number>('REDIS_PORT', 6379));
    return ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        host,
        port,
      },
    });
  }

  // Default: TCP transport
  const prefix = serviceName.toUpperCase().replace('-', '_');
  const host = configService.get<string>(`${prefix}_TCP_HOST`, '127.0.0.1');
  const port = Number(
    configService.get<number>(`${prefix}_TCP_PORT`, defaultPort),
  );

  return ClientProxyFactory.create({
    transport: Transport.TCP,
    options: {
      host,
      port,
    },
  });
}

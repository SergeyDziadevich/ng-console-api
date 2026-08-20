import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('NotificationService');
  const app = await NestFactory.create(AppModule, { cors: true });

  const transportType = (process.env.MICROSERVICE_TRANSPORT || 'tcp').toLowerCase();

  // Connect TCP / Redis RPC
  if (transportType === 'redis') {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      },
    });
  } else {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.TCP,
      options: {
        host: process.env.NOTIFICATION_SERVICE_TCP_HOST || '127.0.0.1',
        port: Number(process.env.NOTIFICATION_SERVICE_TCP_PORT || 4007),
      },
    });
  }

  // Connect Kafka Consumer
  if (process.env.NODE_ENV !== 'test') {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'notification-service',
          brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
        },
        consumer: {
          groupId: 'notifications-system-group',
        },
      },
    });
  }

  await app.startAllMicroservices();
  const wsPort = Number(process.env.NOTIFICATION_WS_PORT || 3007);
  await app.listen(wsPort);

  logger.log(
    `Notification Microservice & WebSocket Server is listening on port ${wsPort}`,
  );
}

void bootstrap();

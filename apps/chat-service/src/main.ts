import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('ChatService');
  const app = await NestFactory.create(AppModule, { cors: true });

  const transportType = (process.env.MICROSERVICE_TRANSPORT || 'tcp').toLowerCase();

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
        host: process.env.CHAT_SERVICE_TCP_HOST || '127.0.0.1',
        port: Number(process.env.CHAT_SERVICE_TCP_PORT || 4006),
      },
    });
  }

  await app.startAllMicroservices();
  const wsPort = Number(process.env.CHAT_WS_PORT || 3006);
  await app.listen(wsPort);

  logger.log(
    `Chat Microservice & WebSocket Server is listening on port ${wsPort} via ${transportType.toUpperCase()} transport`,
  );
}

void bootstrap();

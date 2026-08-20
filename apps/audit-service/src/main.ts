import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('AuditService');
  const transportType = (process.env.MICROSERVICE_TRANSPORT || 'tcp').toLowerCase();

  let rpcOptions: MicroserviceOptions;

  if (transportType === 'redis') {
    rpcOptions = {
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      },
    };
  } else {
    rpcOptions = {
      transport: Transport.TCP,
      options: {
        host: process.env.AUDIT_SERVICE_TCP_HOST || '127.0.0.1',
        port: Number(process.env.AUDIT_SERVICE_TCP_PORT || 4008),
      },
    };
  }

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    rpcOptions,
  );

  // Connect Kafka Consumer
  if (process.env.NODE_ENV !== 'test') {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'audit-service',
          brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
        },
        consumer: {
          groupId: 'audit-group',
        },
      },
    });
  }

  await app.startAllMicroservices();
  await app.listen();
  logger.log(
    `Audit Microservice is listening via ${transportType.toUpperCase()} & Kafka`,
  );
}

void bootstrap();

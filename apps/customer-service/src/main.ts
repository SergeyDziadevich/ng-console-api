import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('CustomerService');
  const transportType = (process.env.MICROSERVICE_TRANSPORT || 'tcp').toLowerCase();

  let options: MicroserviceOptions;

  if (transportType === 'redis') {
    options = {
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      },
    };
  } else {
    options = {
      transport: Transport.TCP,
      options: {
        host: process.env.CUSTOMER_SERVICE_TCP_HOST || '127.0.0.1',
        port: Number(process.env.CUSTOMER_SERVICE_TCP_PORT || 4010),
      },
    };
  }

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    options,
  );

  await app.listen();
  logger.log(
    `Customer Microservice is listening via ${transportType.toUpperCase()} transport`,
  );
}

void bootstrap();

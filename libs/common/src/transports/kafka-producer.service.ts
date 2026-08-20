import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, ProducerRecord, Partitioners } from 'kafkajs';

@Injectable()
export class KafkaProducerService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka?: Kafka;
  private producer?: Producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const broker =
      this.configService.get<string>('KAFKA_BROKER') || 'localhost:9092';
    const clientId =
      this.configService.get<string>('KAFKA_CLIENT_ID') || 'nest-microservices';

    if (process.env.NODE_ENV !== 'test') {
      try {
        this.kafka = new Kafka({
          clientId,
          brokers: [broker],
        });
        this.producer = this.kafka.producer({
          createPartitioner: Partitioners.LegacyPartitioner,
        });
      } catch (err: unknown) {
        this.logger.warn(`Kafka client initialization failed: ${String(err)}`);
      }
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.producer && process.env.NODE_ENV !== 'test') {
      try {
        await this.producer.connect();
        this.isConnected = true;
        this.logger.log('Kafka producer connected successfully');
      } catch (err: unknown) {
        this.logger.warn(
          `Kafka producer connection failed (will run in fallback mode): ${String(err)}`,
        );
      }
    }
  }

  async emit<T = unknown>(topic: string, data: T, key?: string): Promise<void> {
    if (!this.producer || !this.isConnected) {
      this.logger.debug(
        `[Kafka Mock Emit] Topic: ${topic}, Key: ${key ?? 'none'}, Payload: ${JSON.stringify(data)}`,
      );
      return;
    }

    try {
      const record: ProducerRecord = {
        topic,
        messages: [
          {
            key: key || undefined,
            value: JSON.stringify(data),
          },
        ],
      };
      await this.producer.send(record);
    } catch (err: unknown) {
      this.logger.error(
        `Failed to produce Kafka message on topic ${topic}: ${String(err)}`,
      );
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.producer && this.isConnected) {
      try {
        await this.producer.disconnect();
      } catch (err: unknown) {
        this.logger.warn(
          `Kafka producer disconnect warning: ${String(err)}`,
        );
      }
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ProducerService } from '../kafka/producer.service';

@Injectable()
export class AuditProducerService {
  private readonly logger = new Logger(AuditProducerService.name);

  constructor(private readonly producerService: ProducerService) {}

  async logAction(
    action: string,
    entityType: string,
    entityId: string,
    authorId: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      const event = {
        action,
        entityType,
        entityId,
        authorId,
        metadata,
        createdAt: new Date().toISOString(),
      };

      await this.producerService.produce({
        topic: 'audit-logs',
        messages: [{ value: JSON.stringify(event) }],
      });

      this.logger.debug(`Audit log sent to Kafka: ${action} on ${entityType}`);
    } catch (error) {
      this.logger.error('Failed to send audit log to Kafka', error);
    }
  }
}

import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AuditLogEvent, KAFKA_TOPICS } from '@ng-console-api/contracts';
import { AuditService } from './audit.service';

@Controller()
export class AuditConsumerController {
  private readonly logger = new Logger(AuditConsumerController.name);

  constructor(private readonly auditService: AuditService) {}

  @EventPattern(KAFKA_TOPICS.AUDIT_LOGS)
  async handleAuditLog(@Payload() event: AuditLogEvent): Promise<void> {
    if (!event || typeof event !== 'object' || !event.action) {
      this.logger.warn(
        `Received malformed or null audit-logs event: ${JSON.stringify(event)}`,
      );
      return;
    }
    this.logger.log(`Ingesting Kafka audit event: ${event.action}`);
    await this.auditService.logEvent(event);
  }
}

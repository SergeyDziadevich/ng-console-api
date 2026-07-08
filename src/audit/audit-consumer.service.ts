import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConsumerService } from '../kafka/consumer.service';
import { InjectModel } from '@nestjs/mongoose';
import { AuditLog } from '../schemas/audit-log.schema';
import { Model } from 'mongoose';
import { SystemSettingsService } from './system-settings.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuditConsumerService implements OnModuleInit {
  private readonly logger = new Logger(AuditConsumerService.name);

  constructor(
    private readonly consumerService: ConsumerService,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
    private readonly systemSettingsService: SystemSettingsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.consumerService.consume(
      'audit-group',
      { topics: ['audit-logs'] },
      {
        eachMessage: async ({ message }) => {
          try {
            const eventString = message.value?.toString();
            if (!eventString) return;

            const event = JSON.parse(eventString) as Record<string, unknown>;

            // Calculate expiresAt based on retention settings.
            // This is now very fast because getAuditRetentionDays returns a cached value.
            const retentionDays =
              await this.systemSettingsService.getAuditRetentionDays();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + retentionDays);

            const auditLog = new this.auditLogModel({
              ...event,
              expiresAt,
            });

            const savedLog = await auditLog.save();

            // Emit local event to decouple from WebSocket Gateway
            this.eventEmitter.emit('audit.log.created', savedLog);

            this.logger.debug(
              `Audit log saved and event emitted: ${String(savedLog._id)}`,
            );
          } catch (error) {
            this.logger.error('Failed to process audit log message', error);
          }
        },
      },
    );
  }
}

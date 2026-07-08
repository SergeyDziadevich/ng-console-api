import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaModule } from '../kafka/kafka.module';
import { AuditLog, AuditLogSchema } from '../schemas/audit-log.schema';
import {
  SystemSettings,
  SystemSettingsSchema,
} from '../schemas/system-settings.schema';
import { AuditProducerService } from './audit-producer.service';
import { AuditConsumerService } from './audit-consumer.service';
import { AuditController } from './audit.controller';
import { SystemSettingsService } from './system-settings.service';
import { AuditService } from './audit.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: SystemSettings.name, schema: SystemSettingsSchema },
    ]),
    KafkaModule,
  ],
  controllers: [AuditController],
  providers: [
    AuditProducerService,
    AuditConsumerService,
    SystemSettingsService,
    AuditService,
  ],
  exports: [AuditProducerService],
})
export class AuditModule {}

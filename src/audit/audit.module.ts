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
// TODO: We don't have a WsModule exporting it, but let's provide it here or we could import NotificationsModule
// The cleanest way right now, since NotificationsGateway is in NotificationsModule, is to import NotificationsModule if it exports it.
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: SystemSettings.name, schema: SystemSettingsSchema },
    ]),
    KafkaModule,
    //TODO: NotificationsModule, // Instead of importing NotificationsModule which might have circular deps, we can just provide NotificationsGateway. Wait, providing it again creates a second instance of the WebSocket server.
    //TODO: We should export it from NotificationsModule and import it here. Let's assume NotificationsModule is updated to export NotificationsGateway.
    NotificationsModule,
  ],
  controllers: [AuditController],
  providers: [
    AuditProducerService,
    AuditConsumerService,
    SystemSettingsService,
  ],
  exports: [AuditProducerService],
})
export class AuditModule {}

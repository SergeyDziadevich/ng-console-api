import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from '../ws/notifications.gateway';
import { KafkaModule } from '../kafka/kafka.module';
import {
  SystemNotification,
  SystemNotificationSchema,
} from '../schemas/system-notification.schema';

@Module({
  imports: [
    KafkaModule,
    MongooseModule.forFeature([
      { name: SystemNotification.name, schema: SystemNotificationSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}

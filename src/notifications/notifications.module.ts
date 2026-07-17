import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from '../ws/notifications.gateway';
import { KafkaModule } from '../kafka/kafka.module';
import {
  Notification,
  NotificationSchema,
} from '../schemas/notification.schema';
import {
  NotificationReadState,
  NotificationReadStateSchema,
} from '../schemas/notification-read-state.schema';
import { User, UserSchema } from '../schemas/user.schema';
import {
  UserSettings,
  UserSettingsSchema,
} from '../schemas/user-settings.schema';

@Module({
  imports: [
    KafkaModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationReadState.name, schema: NotificationReadStateSchema },
      { name: User.name, schema: UserSchema },
      { name: UserSettings.name, schema: UserSettingsSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}

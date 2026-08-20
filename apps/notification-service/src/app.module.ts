import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationReadState,
  NotificationReadStateSchema,
  NotificationSchema,
} from '@ng-console-api/database';
import { NotificationsController } from './notifications.controller';
import { NotificationsConsumerController } from './notifications-consumer.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI') ||
          'mongodb://localhost:27017/nest-angular',
      }),
    }),
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationReadState.name, schema: NotificationReadStateSchema },
    ]),
  ],
  controllers: [NotificationsController, NotificationsConsumerController],
  providers: [NotificationsService, NotificationsGateway],
})
export class AppModule {}

import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  NotificationsGateway,
  Notification,
} from '../ws/notifications.gateway';
import { randomUUID } from 'node:crypto';
import { ConsumerService } from '../kafka/consumer.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SystemNotification,
  SystemNotificationDocument,
} from '../schemas/system-notification.schema';

export enum SystemEvents {
  USER_CREATED = 'user.created',
  EMAIL_NOTIFICATION = 'email.notification',
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private readonly gateway: NotificationsGateway,
    private readonly consumerService: ConsumerService,
    @InjectModel(SystemNotification.name)
    private readonly systemNotificationModel: Model<SystemNotificationDocument>,
  ) {}

  async onModuleInit() {
    await this.consumerService.consume(
      'notifications-system-group',
      { topics: Object.values(SystemEvents) },
      {
        eachMessage: async ({ topic, message }) => {
          if (message.value) {
            await this.sendSystemNotification(
              `Kafka Event [${topic}]`,
              message.value.toString(),
            );
          }
        },
      },
    );
  }

  send(input: { title: string; body: string }) {
    const notification: Notification = {
      id: randomUUID(),
      title: input.title,
      body: input.body,
      ts: Date.now(),
    };
    this.gateway.broadcast(notification);
  }

  async sendSystemNotification(title: string, body: string) {
    const notification: Notification = {
      id: randomUUID(),
      title,
      body,
      ts: Date.now(),
      isSystem: true,
    };

    await this.systemNotificationModel.create({
      title,
      body,
      ts: notification.ts,
    });

    this.gateway.broadcast(notification);
  }
}

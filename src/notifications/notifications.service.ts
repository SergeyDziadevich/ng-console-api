import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  NotificationsGateway,
  Notification as WsNotification,
} from '../ws/notifications.gateway';
import { randomUUID } from 'node:crypto';
import { ConsumerService } from '../kafka/consumer.service';
import { ProducerService } from '../kafka/producer.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';
import {
  NotificationReadState,
  NotificationReadStateDocument,
} from '../schemas/notification-read-state.schema';
import { User, UserDocument } from '../schemas/user.schema';

export enum SystemEvents {
  USER_CREATED = 'user.created',
  EMAIL_NOTIFICATION = 'email.notification',
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private readonly gateway: NotificationsGateway,
    private readonly consumerService: ConsumerService,
    private readonly producerService: ProducerService,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationReadState.name)
    private readonly notificationReadStateModel: Model<NotificationReadStateDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
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

  async send(input: { title: string; body: string; type?: string; userId?: string }) {
    const notification: WsNotification = {
      id: randomUUID(),
      title: input.title,
      body: input.body,
      ts: Date.now(),
      isSystem: false,
      type: input.type,
    };

    const createdNotification = await this.notificationModel.create({
      title: input.title,
      body: input.body,
      ts: notification.ts,
      isSystem: false,
      type: input.type,
      userId: input.userId,
    });

    this.gateway.broadcast({ ...notification, id: createdNotification._id.toString() });

    if (input.type === 'info' && input.userId) {
      const user = await this.userModel.findById(input.userId).populate('settings').exec();
      if (user && user.settings?.receiveEmails) {
        await this.producerService.produce({
          topic: 'email.notification',
          messages: [{
            value: JSON.stringify({
              to: user.email,
              name: user.username,
              message: input.body,
            }),
          }],
        });
      }
    }
  }

  async sendSystemNotification(title: string, body: string, type?: string) {
    const notification: WsNotification = {
      id: randomUUID(),
      title,
      body,
      ts: Date.now(),
      isSystem: true,
      type,
    };

    const createdNotification = await this.notificationModel.create({
      title,
      body,
      ts: notification.ts,
      isSystem: true,
      type,
    });

    this.gateway.broadcast({ ...notification, id: createdNotification._id.toString() });
  }

  async getNotificationsForUser(userId: string) {
    const notifications = await this.notificationModel
      .find({
        $or: [{ isSystem: true }, { userId }],
      })
      .sort({ ts: -1 })
      .exec();

    const readStates = await this.notificationReadStateModel
      .find({ userId })
      .exec();
    const readIds = new Set(readStates.map((s) => s.notificationId.toString()));

    return notifications.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      body: n.body,
      ts: n.ts,
      isSystem: n.isSystem,
      type: n.type,
      isRead: readIds.has(n._id.toString()),
    }));
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.notificationReadStateModel.updateOne(
      { userId, notificationId },
      { $set: { userId, notificationId } },
      { upsert: true }
    );
  }
}

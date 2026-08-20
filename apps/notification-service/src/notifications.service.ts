import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationReadState,
  NotificationReadStateDocument,
} from '@ng-console-api/database';
import {
  CreateNotificationCommand,
  MarkAsReadCommand,
  NotificationDto,
} from '@ng-console-api/contracts';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notifModel: Model<NotificationDocument>,
    @InjectModel(NotificationReadState.name)
    private readonly readStateModel: Model<NotificationReadStateDocument>,
  ) {}

  async createNotification(
    cmd: CreateNotificationCommand,
  ): Promise<NotificationDto> {
    const notif = await this.notifModel.create({
      title: cmd.title,
      body: cmd.message,
      ts: Date.now(),
      isSystem: cmd.broadcast || false,
      type: cmd.type,
      userId: cmd.userId,
    });

    return {
      id: String(notif._id),
      userId: cmd.userId,
      title: notif.title,
      message: notif.body,
      type: notif.type || 'info',
      isRead: false,
      metadata: cmd.metadata,
      createdAt: new Date(notif.ts).toISOString(),
    };
  }

  async getUserNotifications(userId: string): Promise<NotificationDto[]> {
    const notifs = await this.notifModel
      .find({
        $or: [{ userId }, { isSystem: true }],
      })
      .sort({ ts: -1 })
      .limit(50)
      .exec();

    const readStates = await this.readStateModel.find({ userId }).exec();
    const readIds = new Set(readStates.map((r) => String(r.notificationId)));

    return notifs.map((n) => ({
      id: String(n._id),
      userId: n.userId ? String(n.userId) : undefined,
      title: n.title,
      message: n.body,
      type: n.type || 'info',
      isRead: readIds.has(String(n._id)),
      createdAt: new Date(n.ts).toISOString(),
    }));
  }

  async markAsRead(cmd: MarkAsReadCommand): Promise<{ success: boolean }> {
    const existing = await this.readStateModel.findOne({
      userId: cmd.userId,
      notificationId: cmd.notificationId,
    });

    if (!existing) {
      await this.readStateModel.create({
        userId: cmd.userId,
        notificationId: cmd.notificationId,
      });
    }

    return { success: true };
  }
}

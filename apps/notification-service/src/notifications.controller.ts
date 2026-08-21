import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateNotificationCommand,
  MarkAsReadCommand,
  NotificationDto,
  NOTIFICATIONS_PATTERNS,
} from '@ng-console-api/contracts';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @MessagePattern(NOTIFICATIONS_PATTERNS.CREATE_NOTIFICATION)
  async createNotification(
    @Payload() data: CreateNotificationCommand,
  ): Promise<NotificationDto> {
    return this.notificationsService.createNotification(data);
  }

  @MessagePattern(NOTIFICATIONS_PATTERNS.GET_USER_NOTIFICATIONS)
  async getUserNotifications(
    @Payload() data: { userId: string },
  ): Promise<NotificationDto[]> {
    return this.notificationsService.getUserNotifications(data.userId);
  }

  @MessagePattern(NOTIFICATIONS_PATTERNS.MARK_AS_READ)
  async markAsRead(
    @Payload() data: MarkAsReadCommand,
  ): Promise<{ success: boolean }> {
    return this.notificationsService.markAsRead(data);
  }
}

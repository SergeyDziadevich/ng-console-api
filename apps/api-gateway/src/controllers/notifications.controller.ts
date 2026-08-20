import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateNotificationCommand,
  MarkAsReadCommand,
  MICROSERVICE_SERVICES,
  NotificationDto,
  NOTIFICATIONS_PATTERNS,
} from '@ng-console-api/contracts';
import { CurrentUser, JwtAuthGuard, UserContext } from '@ng-console-api/common';
import { CreateNotificationDto } from '../dto/notification.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsGatewayController {
  constructor(
    @Inject(MICROSERVICE_SERVICES.NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
  ) {}

  @Get()
  async getUserNotifications(
    @CurrentUser() user: UserContext,
  ): Promise<NotificationDto[]> {
    return firstValueFrom(
      this.notificationClient.send<NotificationDto[], { userId: string }>(
        NOTIFICATIONS_PATTERNS.GET_USER_NOTIFICATIONS,
        { userId: user.id },
      ),
    );
  }

  @Post(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: UserContext,
  ): Promise<{ success: boolean }> {
    const payload: MarkAsReadCommand = {
      notificationId: id,
      userId: user.id,
    };
    return firstValueFrom(
      this.notificationClient.send<{ success: boolean }, MarkAsReadCommand>(
        NOTIFICATIONS_PATTERNS.MARK_AS_READ,
        payload,
      ),
    );
  }

  @Post('notify')
  async createNotification(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateNotificationDto,
  ): Promise<NotificationDto> {
    const payload: CreateNotificationCommand = {
      userId: dto.userId || user.id,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      broadcast: dto.broadcast,
      metadata: dto.metadata,
    };
    return firstValueFrom(
      this.notificationClient.send<NotificationDto, CreateNotificationCommand>(
        NOTIFICATIONS_PATTERNS.CREATE_NOTIFICATION,
        payload,
      ),
    );
  }
}

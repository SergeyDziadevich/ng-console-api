import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  EmailNotificationEvent,
  KAFKA_TOPICS,
  TicketAssignedEvent,
  UserCreatedEvent,
} from '@ng-console-api/contracts';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@Controller()
export class NotificationsConsumerController {
  private readonly logger = new Logger(NotificationsConsumerController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @EventPattern(KAFKA_TOPICS.USER_CREATED)
  async handleUserCreated(@Payload() event: UserCreatedEvent): Promise<void> {
    this.logger.log(`Received user.created event for user ${event.email}`);
    const notif = await this.notificationsService.createNotification({
      userId: event.userId,
      title: 'Welcome to Cloud Console',
      message: `Hello ${event.name}, welcome aboard!`,
      type: 'user.created',
      broadcast: false,
    });
    this.notificationsGateway.sendToUser(event.userId, notif);
  }

  @EventPattern(KAFKA_TOPICS.TICKET_ASSIGNED)
  async handleTicketAssigned(
    @Payload() event: TicketAssignedEvent,
  ): Promise<void> {
    this.logger.log(`Received ticket.assigned event for ticket ${event.ticketId}`);
    const notif = await this.notificationsService.createNotification({
      userId: event.userId,
      title: 'Ticket Assigned',
      message: `You have been assigned to ticket: ${event.title}`,
      type: 'ticket.assigned',
      metadata: { ticketId: event.ticketId },
    });
    this.notificationsGateway.sendToUser(event.userId, notif);
  }

  @EventPattern(KAFKA_TOPICS.EMAIL_NOTIFICATION)
  async handleEmailNotification(
    @Payload() event: EmailNotificationEvent,
  ): Promise<void> {
    this.logger.log(`Received email.notification event for ${event.to}`);
    const notif = await this.notificationsService.createNotification({
      title: event.subject || 'System Notification',
      message: event.message,
      type: 'email.notification',
      broadcast: true,
    });
    this.notificationsGateway.broadcast(notif);
  }
}

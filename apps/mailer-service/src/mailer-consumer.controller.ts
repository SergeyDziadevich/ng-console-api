import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  EmailNotificationEvent,
  KAFKA_TOPICS,
  SubscriptionActivatedEvent,
  UserCreatedEvent,
} from '@ng-console-api/contracts';
import { MailerService } from './mailer.service';

@Controller()
export class MailerConsumerController {
  private readonly logger = new Logger(MailerConsumerController.name);

  constructor(private readonly mailerService: MailerService) {}

  @EventPattern(KAFKA_TOPICS.USER_CREATED)
  async handleUserCreated(@Payload() event: UserCreatedEvent): Promise<void> {
    this.logger.log(`Received user.created event for ${event.email}`);
    await this.mailerService.sendWelcomeEmail(event.email, event.name);
  }

  @EventPattern(KAFKA_TOPICS.EMAIL_NOTIFICATION)
  async handleEmailNotification(
    @Payload() event: EmailNotificationEvent,
  ): Promise<void> {
    this.logger.log(`Received email.notification event for ${event.to}`);
    await this.mailerService.sendEmail({
      to: event.to,
      subject: event.subject || 'Notification from Cloud Console',
      template: event.template || 'notification',
      context: event.context || { message: event.message, name: event.name },
    });
  }

  @EventPattern(KAFKA_TOPICS.SUBSCRIPTION_ACTIVATED)
  async handleSubscriptionActivated(
    @Payload() event: SubscriptionActivatedEvent,
  ): Promise<void> {
    this.logger.log(`Received subscription.activated event for ${event.email}`);
    await this.mailerService.sendSubscriptionActivatedEmail(
      event.email,
      event.name,
      event.planName,
      event.manageLink,
    );
  }
}

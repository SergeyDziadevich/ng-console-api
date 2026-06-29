import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConsumerService } from '../kafka/consumer.service';
import { MailerService } from '@nestjs-modules/mailer';

interface NotificationPayload {
  to: string;
  name: string;
  message: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly consumerService: ConsumerService,
  ) {}

  async onModuleInit() {
    await this.consumerService.consume(
      'email-consumer-group',
      { topics: ['email.notification', 'user.created'] },
      {
        eachMessage: async ({ topic, message }) => {
          if (message.value) {
            if (topic === 'email.notification') {
              const data = JSON.parse(
                message.value.toString(),
              ) as NotificationPayload;
              await this.sendNotificationEmail(
                data.to,
                data.name,
                data.message,
              );
            } else if (topic === 'user.created') {
              const data = JSON.parse(message.value.toString()) as {
                email: string;
                name: string;
              };
              await this.sendNewUserEmail(data);
            }
          }
        },
      },
    );
  }

  async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, unknown>,
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
      this.logger.log(`Email successfully sent to ${to}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to send email to ${to}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Failed to send email to ${to}: ${String(error)}`);
      }
      throw error;
    }
  }

  async sendWelcomeEmail(user: { email: string; name: string }) {
    await this.sendEmail(
      user.email,
      'Welcome to our platform!',
      'welcome', // Corresponds to welcome.hbs
      { name: user.name },
    );
  }

  async sendNewUserEmail(user: { email: string; name: string }) {
    await this.sendEmail(
      user.email,
      'New Account Created',
      'welcome', // Corresponds to welcome.hbs
      { name: user.name, email: user.email },
    );
  }

  async sendNotificationEmail(to: string, name: string, message: string) {
    await this.sendEmail(
      to,
      'New Notification',
      'notification', // Corresponds to notification.hbs
      { name, message },
    );
  }
}

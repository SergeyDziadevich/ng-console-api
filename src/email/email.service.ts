import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

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

  async sendNotificationEmail(to: string, name: string, message: string) {
    await this.sendEmail(
      to,
      'New Notification',
      'notification', // Corresponds to notification.hbs
      { name, message },
    );
  }
}

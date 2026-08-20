import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailResultDto, SendEmailCommand } from '@ng-console-api/contracts';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter?: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = Number(this.configService.get<number>('SMTP_PORT', 1025));

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        ignoreTLS: true,
      });
    } catch (err: unknown) {
      this.logger.warn(`Transporter init warning: ${String(err)}`);
    }
  }

  async sendEmail(cmd: SendEmailCommand): Promise<EmailResultDto> {
    this.logger.log(`Sending email to ${cmd.to} with subject "${cmd.subject}"`);

    if (!this.transporter || process.env.NODE_ENV === 'test') {
      this.logger.debug(
        `[Mailer Test/Mock Send] To: ${cmd.to}, Subject: ${cmd.subject}, Context: ${JSON.stringify(cmd.context)}`,
      );
      return { success: true, messageId: `msg_${Date.now()}` };
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"Cloud Console" <no-reply@console.example.com>',
        to: cmd.to,
        subject: cmd.subject,
        text: JSON.stringify(cmd.context),
        html: `<p>${JSON.stringify(cmd.context)}</p>`,
      });
      return { success: true, messageId: info.messageId };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Send email error';
      this.logger.error(`Failed to send email to ${cmd.to}: ${message}`);
      return { success: false, error: message };
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<EmailResultDto> {
    return this.sendEmail({
      to,
      subject: 'Welcome to Cloud Console',
      template: 'welcome',
      context: { name, welcomeMessage: 'Welcome to our platform!' },
    });
  }

  async sendSubscriptionActivatedEmail(
    to: string,
    name: string,
    planName: string,
    manageLink: string,
  ): Promise<EmailResultDto> {
    return this.sendEmail({
      to,
      subject: 'Subscription Activated - Cloud Console',
      template: 'subscription-activated',
      context: { name, planName, manageLink },
    });
  }
}

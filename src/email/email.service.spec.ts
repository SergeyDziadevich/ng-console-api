import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConsumerService } from '../kafka/consumer.service';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: ConsumerService,
          useValue: {
            consume: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);

    // Silence the logger to prevent error output during tests
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call mailerService.sendMail on sendWelcomeEmail', async () => {
    const user = { email: 'test@example.com', name: 'Test User' };
    await service.sendWelcomeEmail(user);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: user.email,
      subject: 'Welcome to our platform!',
      template: 'welcome',
      context: { name: user.name },
    });
  });

  it('should call mailerService.sendMail on sendNotificationEmail', async () => {
    const to = 'test@example.com';
    const name = 'Test User';
    const message = 'You have a new alert!';
    await service.sendNotificationEmail(to, name, message);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to,
      subject: 'New Notification',
      template: 'notification',
      context: { name, message },
    });
  });

  describe('sendEmail direct', () => {
    it('should send a generic email successfully', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const template = 'test-template';
      const context = { foo: 'bar' };

      await service.sendEmail(to, subject, template, context);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject,
        template,
        context,
      });
    });

    it('should log and throw error when sending email fails (Error instance)', async () => {
      const error = new Error('SMTP Error');
      jest.spyOn(mailerService, 'sendMail').mockRejectedValueOnce(error);
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await expect(
        service.sendEmail('test@example.com', 'Subj', 'tmpl', {}),
      ).rejects.toThrow('SMTP Error');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send email to test@example.com: SMTP Error',
        error.stack,
      );
    });

    it('should log and throw error when sending email fails (non-Error instance)', async () => {
      const error = 'String error';
      jest.spyOn(mailerService, 'sendMail').mockRejectedValueOnce(error);
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await expect(
        service.sendEmail('test@example.com', 'Subj', 'tmpl', {}),
      ).rejects.toEqual('String error');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send email to test@example.com: String error',
      );
    });
  });
});

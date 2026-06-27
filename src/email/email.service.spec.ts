import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { MailerService } from '@nestjs-modules/mailer';

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
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call mailerService.sendMail on sendWelcomeEmail', async () => {
    const user = { email: 'test@example.com', name: 'Test User' };
    await service.sendWelcomeEmail(user);

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

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to,
      subject: 'New Notification',
      template: 'notification',
      context: { name, message },
    });
  });
});

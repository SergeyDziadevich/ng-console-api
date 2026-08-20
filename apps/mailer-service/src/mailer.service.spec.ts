import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';

describe('MailerService', () => {
  let service: MailerService;

  const mockConfigService: { get: jest.Mock } = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'SMTP_HOST') return 'localhost';
      if (key === 'SMTP_PORT') return 1025;
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);
  });

  describe('sendEmail', () => {
    it('should return success and messageId in test environment', async () => {
      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test subject',
        template: 'test',
        context: { user: 'Tester' },
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      const result = await service.sendWelcomeEmail('newuser@example.com', 'New User');
      expect(result.success).toBe(true);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { MailerConsumerController } from './mailer-consumer.controller';
import { MailerService } from './mailer.service';
import {
  EmailNotificationEvent,
  SubscriptionActivatedEvent,
  UserCreatedEvent,
} from '@ng-console-api/contracts';

describe('MailerConsumerController', () => {
  let controller: MailerConsumerController;

  const mockMailerService: {
    sendWelcomeEmail: jest.Mock;
    sendEmail: jest.Mock;
    sendSubscriptionActivatedEmail: jest.Mock;
  } = {
    sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
    sendEmail: jest
      .fn()
      .mockResolvedValue({ success: true, messageId: 'msg-1' }),
    sendSubscriptionActivatedEmail: jest
      .fn()
      .mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailerConsumerController],
      providers: [
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    controller = module.get<MailerConsumerController>(MailerConsumerController);
  });

  describe('handleUserCreated', () => {
    it('should process valid user.created event', async () => {
      const event: UserCreatedEvent = {
        userId: 'u1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: '2026-08-20T00:00:00.000Z',
      };

      await controller.handleUserCreated(event);
      expect(mockMailerService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
      );
    });

    it('should safely ignore null/undefined event without throwing', async () => {
      const nullEvent = null as unknown as UserCreatedEvent;
      await expect(
        controller.handleUserCreated(nullEvent),
      ).resolves.toBeUndefined();
      expect(mockMailerService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('should safely ignore malformed event without email', async () => {
      const invalidEvent = { userId: 'u1' } as unknown as UserCreatedEvent;
      await expect(
        controller.handleUserCreated(invalidEvent),
      ).resolves.toBeUndefined();
      expect(mockMailerService.sendWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe('handleEmailNotification', () => {
    it('should process valid email.notification event', async () => {
      const event: EmailNotificationEvent = {
        to: 'user@example.com',
        name: 'Test User',
        subject: 'Custom Subject',
        message: 'Hello world',
        template: 'custom-template',
        context: { orderId: 'ord-123' },
      };

      await controller.handleEmailNotification(event);
      expect(mockMailerService.sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Custom Subject',
        template: 'custom-template',
        context: { orderId: 'ord-123' },
      });
    });

    it('should safely ignore null/undefined event without throwing', async () => {
      const nullEvent = null as unknown as EmailNotificationEvent;
      await expect(
        controller.handleEmailNotification(nullEvent),
      ).resolves.toBeUndefined();
      expect(mockMailerService.sendEmail).not.toHaveBeenCalled();
    });

    it('should safely ignore malformed event without to address', async () => {
      const invalidEvent = {
        message: 'no recipient',
      } as unknown as EmailNotificationEvent;
      await expect(
        controller.handleEmailNotification(invalidEvent),
      ).resolves.toBeUndefined();
      expect(mockMailerService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionActivated', () => {
    it('should process valid subscription.activated event', async () => {
      const event: SubscriptionActivatedEvent = {
        userId: 'u-1',
        email: 'subscriber@example.com',
        name: 'Subscriber One',
        planName: 'Enterprise',
        planId: 'plan-enterprise',
        manageLink: 'https://console.example.com/manage',
        timestamp: '2026-08-20T00:00:00.000Z',
      };

      await controller.handleSubscriptionActivated(event);
      expect(
        mockMailerService.sendSubscriptionActivatedEmail,
      ).toHaveBeenCalledWith(
        'subscriber@example.com',
        'Subscriber One',
        'Enterprise',
        'https://console.example.com/manage',
      );
    });

    it('should safely ignore null/undefined event without throwing', async () => {
      const nullEvent = null as unknown as SubscriptionActivatedEvent;
      await expect(
        controller.handleSubscriptionActivated(nullEvent),
      ).resolves.toBeUndefined();
      expect(
        mockMailerService.sendSubscriptionActivatedEmail,
      ).not.toHaveBeenCalled();
    });

    it('should safely ignore malformed event without email', async () => {
      const invalidEvent = {
        planName: 'Enterprise',
      } as unknown as SubscriptionActivatedEvent;
      await expect(
        controller.handleSubscriptionActivated(invalidEvent),
      ).resolves.toBeUndefined();
      expect(
        mockMailerService.sendSubscriptionActivatedEmail,
      ).not.toHaveBeenCalled();
    });
  });
});

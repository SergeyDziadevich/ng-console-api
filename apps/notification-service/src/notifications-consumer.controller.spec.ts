import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsConsumerController } from './notifications-consumer.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import {
  EmailNotificationEvent,
  TicketAssignedEvent,
  UserCreatedEvent,
} from '@ng-console-api/contracts';

describe('NotificationsConsumerController', () => {
  let controller: NotificationsConsumerController;

  const mockNotificationsService: {
    createNotification: jest.Mock;
  } = {
    createNotification: jest.fn().mockResolvedValue({
      id: 'notif-123',
      title: 'Test Notification',
      message: 'Test message',
      type: 'test',
      isRead: false,
      createdAt: new Date(),
    }),
  };

  const mockNotificationsGateway: {
    sendToUser: jest.Mock;
    broadcast: jest.Mock;
  } = {
    sendToUser: jest.fn(),
    broadcast: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsConsumerController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
        },
      ],
    }).compile();

    controller = module.get<NotificationsConsumerController>(
      NotificationsConsumerController,
    );
  });

  describe('handleUserCreated', () => {
    it('should process valid user.created event and dispatch notification', async () => {
      const event: UserCreatedEvent = {
        userId: 'user-abc',
        email: 'alice@example.com',
        name: 'Alice',
        role: 'user',
        createdAt: '2026-08-20T00:00:00.000Z',
      };

      await controller.handleUserCreated(event);
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith({
        userId: 'user-abc',
        title: 'Welcome to Cloud Console',
        message: 'Hello Alice, welcome aboard!',
        type: 'user.created',
        broadcast: false,
      });
      expect(mockNotificationsGateway.sendToUser).toHaveBeenCalledWith(
        'user-abc',
        expect.objectContaining({ id: 'notif-123' }),
      );
    });

    it('should safely handle null/undefined event without throwing', async () => {
      const nullEvent = null as unknown as UserCreatedEvent;
      await expect(
        controller.handleUserCreated(nullEvent),
      ).resolves.toBeUndefined();
      expect(
        mockNotificationsService.createNotification,
      ).not.toHaveBeenCalled();
      expect(mockNotificationsGateway.sendToUser).not.toHaveBeenCalled();
    });

    it('should safely ignore malformed event without userId', async () => {
      const invalidEvent = {
        email: 'alice@example.com',
      } as unknown as UserCreatedEvent;
      await expect(
        controller.handleUserCreated(invalidEvent),
      ).resolves.toBeUndefined();
      expect(
        mockNotificationsService.createNotification,
      ).not.toHaveBeenCalled();
      expect(mockNotificationsGateway.sendToUser).not.toHaveBeenCalled();
    });
  });

  describe('handleTicketAssigned', () => {
    it('should process valid ticket.assigned event and send to user', async () => {
      const event: TicketAssignedEvent = {
        ticketId: 't-99',
        userId: 'user-abc',
        title: 'Fix issue',
        assignedBy: 'admin',
        priority: 'high',
        timestamp: '2026-08-20T00:00:00.000Z',
      };

      await controller.handleTicketAssigned(event);
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith({
        userId: 'user-abc',
        title: 'Ticket Assigned',
        message: 'You have been assigned to ticket: Fix issue',
        type: 'ticket.assigned',
        metadata: { ticketId: 't-99' },
      });
      expect(mockNotificationsGateway.sendToUser).toHaveBeenCalledWith(
        'user-abc',
        expect.objectContaining({ id: 'notif-123' }),
      );
    });

    it('should safely handle null/undefined event without throwing', async () => {
      const nullEvent = null as unknown as TicketAssignedEvent;
      await expect(
        controller.handleTicketAssigned(nullEvent),
      ).resolves.toBeUndefined();
      expect(
        mockNotificationsService.createNotification,
      ).not.toHaveBeenCalled();
      expect(mockNotificationsGateway.sendToUser).not.toHaveBeenCalled();
    });

    it('should safely ignore malformed event without ticketId or userId', async () => {
      const invalidEvent = {
        title: 'Ticket only',
      } as unknown as TicketAssignedEvent;
      await expect(
        controller.handleTicketAssigned(invalidEvent),
      ).resolves.toBeUndefined();
      expect(
        mockNotificationsService.createNotification,
      ).not.toHaveBeenCalled();
      expect(mockNotificationsGateway.sendToUser).not.toHaveBeenCalled();
    });
  });

  describe('handleEmailNotification', () => {
    it('should process valid email.notification event and broadcast', async () => {
      const event: EmailNotificationEvent = {
        to: 'everyone@example.com',
        name: 'Everyone',
        subject: 'System Maintenance',
        message: 'System upgrade at midnight',
      };

      await controller.handleEmailNotification(event);
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith({
        title: 'System Maintenance',
        message: 'System upgrade at midnight',
        type: 'email.notification',
        broadcast: true,
      });
      expect(mockNotificationsGateway.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'notif-123' }),
      );
    });

    it('should safely handle null/undefined event without throwing', async () => {
      const nullEvent = null as unknown as EmailNotificationEvent;
      await expect(
        controller.handleEmailNotification(nullEvent),
      ).resolves.toBeUndefined();
      expect(
        mockNotificationsService.createNotification,
      ).not.toHaveBeenCalled();
      expect(mockNotificationsGateway.broadcast).not.toHaveBeenCalled();
    });

    it('should safely ignore malformed event missing both to and message', async () => {
      const invalidEvent = {} as unknown as EmailNotificationEvent;
      await expect(
        controller.handleEmailNotification(invalidEvent),
      ).resolves.toBeUndefined();
      expect(
        mockNotificationsService.createNotification,
      ).not.toHaveBeenCalled();
      expect(mockNotificationsGateway.broadcast).not.toHaveBeenCalled();
    });
  });
});

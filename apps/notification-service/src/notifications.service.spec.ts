import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationReadState } from '@ng-console-api/database';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockNotifModel: {
    create: jest.Mock;
    find: jest.Mock;
  } = {
    create: jest.fn(),
    find: jest.fn(),
  };

  const mockReadStateModel: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  } = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotifModel,
        },
        {
          provide: getModelToken(NotificationReadState.name),
          useValue: mockReadStateModel,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('createNotification', () => {
    it('should create notification in database', async () => {
      const mockNotif = {
        _id: 'notif-1',
        title: 'Alert',
        body: 'Server load high',
        ts: Date.now(),
        isSystem: false,
        type: 'alert',
        userId: 'user-1',
      };

      mockNotifModel.create.mockResolvedValue(mockNotif);

      const result = await service.createNotification({
        userId: 'user-1',
        title: 'Alert',
        message: 'Server load high',
        type: 'alert',
      });

      expect(result.id).toBe('notif-1');
      expect(result.title).toBe('Alert');
      expect(result.isRead).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should create a read state record if not existing', async () => {
      mockReadStateModel.findOne.mockResolvedValue(null);
      mockReadStateModel.create.mockResolvedValue({ _id: 'rs-1' });

      const result = await service.markAsRead({
        userId: 'user-1',
        notificationId: 'notif-1',
      });

      expect(result.success).toBe(true);
      expect(mockReadStateModel.create).toHaveBeenCalledWith({
        userId: 'user-1',
        notificationId: 'notif-1',
      });
    });
  });
});

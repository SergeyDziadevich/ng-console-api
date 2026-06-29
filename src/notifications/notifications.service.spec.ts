import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from '../ws/notifications.gateway';
import { ConsumerService } from '../kafka/consumer.service';
import { getModelToken } from '@nestjs/mongoose';
import { SystemNotification } from '../schemas/system-notification.schema';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsGateway,
          useValue: { broadcast: jest.fn() },
        },
        {
          provide: ConsumerService,
          useValue: { consume: jest.fn() },
        },
        {
          provide: getModelToken(SystemNotification.name),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

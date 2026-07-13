import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';

import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { ProducerService } from '../kafka/producer.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock_secret'),
          },
        },
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: ProducerService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

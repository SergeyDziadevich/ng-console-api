import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { KafkaProducerService } from '@ng-console-api/common';
import { KAFKA_TOPICS } from '@ng-console-api/contracts';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockConfigService: { get: jest.Mock } = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return 'sk_test_123';
      if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test_123';
      return null;
    }),
  };

  const mockKafkaProducer: { emit: jest.Mock } = {
    emit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: KafkaProducerService,
          useValue: mockKafkaProducer,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createCheckout', () => {
    it('should create a checkout session DTO', async () => {
      const result = await service.createCheckout({
        userId: 'user-1',
        userEmail: 'user@example.com',
        priceId: 'price_123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.sessionId).toBeDefined();
      expect(result.url).toBeDefined();
    });
  });

  describe('handleWebhook', () => {
    it('should emit subscription.activated and audit-logs on checkout.session.completed', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            client_reference_id: 'user-uuid-1',
            customer_details: { email: 'user@example.com' },
            amount_total: 4900,
            subscription: 'sub_123',
          },
        },
      };

      const result = await service.handleWebhook({
        payload: JSON.stringify(mockEvent),
        signature: 'sig',
      });

      expect(result.received).toBe(true);
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.SUBSCRIPTION_ACTIVATED,
        expect.objectContaining({
          userId: 'user-uuid-1',
          email: 'user@example.com',
          planName: 'Pro Tier',
        }),
        'user-uuid-1',
      );
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.AUDIT_LOGS,
        expect.objectContaining({
          action: 'SUBSCRIPTION_ACTIVATED',
          authorId: 'user-uuid-1',
        }),
        'user-uuid-1',
      );
    });
  });
});

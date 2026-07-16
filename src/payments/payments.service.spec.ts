import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { ProducerService } from '../kafka/producer.service';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

const mockUser = {
  _id: { toString: () => 'user-id-1' },
  email: 'test@example.com',
  username: 'testuser',
  stripeCustomerId: 'cus_mock123',
  stripeSubscriptionId: 'sub_mock123',
  planId: 'price_mock123',
};

const mockStripeSubscription = {
  status: 'active',
  cancel_at_period_end: false,
  trial_start: null,
  trial_end: null,
  current_period_start: 1700000000,
  current_period_end: 1702600000,
  start_date: 1699000000,
  items: {
    data: [
      {
        price: {
          product: 'prod_mock123',
        },
      },
    ],
  },
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  let usersService: jest.Mocked<UsersService>;
  let authService: jest.Mocked<AuthService>;

  const mockStripe = {
    checkout: {
      sessions: {
        retrieve: jest.fn(),
        create: jest.fn(),
      },
    },
    customers: {
      create: jest.fn(),
    },
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
    prices: {
      retrieve: jest.fn(),
    },
    products: {
      retrieve: jest.fn(),
    },
    invoices: {
      list: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('sk_test_mock'),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserById: jest.fn(),
            updateUser: jest.fn(),
            findByStripeCustomerId: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            refreshToken: jest.fn().mockResolvedValue({ accessToken: 'token' }),
          },
        },
        {
          provide: ProducerService,
          useValue: {
            produce: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    usersService = module.get(UsersService);
    authService = module.get(AuthService);

    // Inject mock stripe client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).stripe = mockStripe;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getSubscriptionDetails ──────────────────────────────────────────────────

  describe('getSubscriptionDetails', () => {
    it('should return subscription details with mapped period fields', async () => {
      usersService.getUserById.mockResolvedValue(mockUser as never);
      mockStripe.subscriptions.retrieve.mockResolvedValue(
        mockStripeSubscription as never,
      );

      const result = await service.getSubscriptionDetails('user-id-1');

      expect(result).toEqual({
        status: 'active',
        productId: 'prod_mock123',
        currentPeriodStart: 1700000000,
        currentPeriodEnd: 1702600000,
        cancelAtPeriodEnd: false,
        trialStart: null,
        trialEnd: null,
      });
    });

    it('should fall back to start_date when current_period_start is 0', async () => {
      usersService.getUserById.mockResolvedValue(mockUser as never);
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        ...mockStripeSubscription,
        current_period_start: 0,
        start_date: 1699000000,
      } as never);

      const result = await service.getSubscriptionDetails('user-id-1');

      expect(result.currentPeriodStart).toBe(1699000000);
    });

    it('should return 0 when both current_period_start and start_date are 0', async () => {
      usersService.getUserById.mockResolvedValue(mockUser as never);
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        ...mockStripeSubscription,
        current_period_start: 0,
        start_date: 0,
      } as never);

      const result = await service.getSubscriptionDetails('user-id-1');

      expect(result.currentPeriodStart).toBe(0);
    });

    it('should fall back to user planId when product has no id', async () => {
      usersService.getUserById.mockResolvedValue(mockUser as never);
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        ...mockStripeSubscription,
        items: { data: [{ price: { product: null } }] },
      } as never);

      const result = await service.getSubscriptionDetails('user-id-1');

      expect(result.productId).toBe('price_mock123');
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.getUserById.mockResolvedValue(null as never);

      await expect(
        service.getSubscriptionDetails('user-id-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user has no subscription', async () => {
      usersService.getUserById.mockResolvedValue({
        ...mockUser,
        stripeSubscriptionId: null,
      } as never);

      await expect(
        service.getSubscriptionDetails('user-id-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException when Stripe call fails', async () => {
      usersService.getUserById.mockResolvedValue(mockUser as never);
      mockStripe.subscriptions.retrieve.mockRejectedValue(
        new Error('Stripe error'),
      );

      await expect(
        service.getSubscriptionDetails('user-id-1'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── getInvoices ─────────────────────────────────────────────────────────────

  describe('getInvoices', () => {
    it('should return mapped invoices with amounts converted from cents', async () => {
      usersService.getUserById.mockResolvedValue(mockUser as never);
      mockStripe.invoices.list.mockResolvedValue({
        data: [
          {
            id: 'inv_1',
            amount_paid: 2000,
            status: 'paid',
            created: 1700000000,
            hosted_invoice_url: 'https://invoice.url',
            invoice_pdf: 'https://invoice.pdf',
          },
        ],
      } as never);

      const result = await service.getInvoices('user-id-1');

      expect(result).toEqual([
        {
          id: 'inv_1',
          amountPaid: 20,
          status: 'paid',
          created: 1700000000,
          hostedInvoiceUrl: 'https://invoice.url',
          invoicePdf: 'https://invoice.pdf',
        },
      ]);
    });

    it('should return empty array when user has no stripeCustomerId', async () => {
      usersService.getUserById.mockResolvedValue({
        ...mockUser,
        stripeCustomerId: null,
      } as never);

      const result = await service.getInvoices('user-id-1');

      expect(result).toEqual([]);
      expect(mockStripe.invoices.list).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.getUserById.mockResolvedValue(null as never);

      await expect(service.getInvoices('user-id-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException when Stripe call fails', async () => {
      usersService.getUserById.mockResolvedValue(mockUser as never);
      mockStripe.invoices.list.mockRejectedValue(new Error('Stripe error'));

      await expect(service.getInvoices('user-id-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ─── createPortalSession ─────────────────────────────────────────────────────

  describe('createPortalSession', () => {
    it('should return billing portal url', async () => {
      usersService.getUserById.mockResolvedValue(mockUser as never);
      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/session',
      } as never);

      const result = await service.createPortalSession(
        'user-id-1',
        'https://app.example.com',
      );

      expect(result).toEqual({ url: 'https://billing.stripe.com/session' });
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_mock123',
        return_url: 'https://app.example.com',
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.getUserById.mockResolvedValue(null as never);

      await expect(
        service.createPortalSession('user-id-1', 'https://return.url'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user has no stripeCustomerId', async () => {
      usersService.getUserById.mockResolvedValue({
        ...mockUser,
        stripeCustomerId: null,
      } as never);

      await expect(
        service.createPortalSession('user-id-1', 'https://return.url'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── verifySession ────────────────────────────────────────────────────────────

  describe('verifySession', () => {
    it('should update user subscription and refresh token when session is paid', async () => {
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        payment_status: 'paid',
        metadata: { userId: 'user-id-1', priceId: 'price_mock' },
        subscription: 'sub_new123',
      } as never);
      authService.refreshToken.mockResolvedValue({
        accessToken: 'new_token',
      } as never);

      const result = await service.verifySession('user-id-1', 'cs_mock');

      expect(usersService.updateUser).toHaveBeenCalledWith('user-id-1', {
        stripeSubscriptionId: 'sub_new123',
        stripeSubscriptionStatus: 'active',
        planId: 'price_mock',
      });
      expect(result).toEqual({ accessToken: 'new_token' });
    });

    it('should not update user when payment_status is not paid', async () => {
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        payment_status: 'unpaid',
        metadata: { userId: 'user-id-1' },
        subscription: 'sub_new123',
      } as never);
      authService.refreshToken.mockResolvedValue({
        accessToken: 'token',
      } as never);

      await service.verifySession('user-id-1', 'cs_mock');

      expect(usersService.updateUser).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when Stripe call fails', async () => {
      mockStripe.checkout.sessions.retrieve.mockRejectedValue(
        new Error('Stripe error'),
      );

      await expect(
        service.verifySession('user-id-1', 'cs_mock'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});

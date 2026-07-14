import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { JwtService } from '@nestjs/jwt';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: jest.Mocked<PaymentsService>;

  beforeEach(async () => {
    const mockPaymentsService = {
      createCheckoutSession: jest.fn(),
      verifySession: jest.fn(),
      createPortalSession: jest.fn(),
      getSubscriptionDetails: jest.fn(),
      getInvoices: jest.fn(),
      handleWebhook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    paymentsService = module.get(PaymentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCheckoutSession', () => {
    it('should call paymentsService.createCheckoutSession', async () => {
      const mockReq = { user: { sub: 'user-1' } } as any;
      const mockBody = {
        priceId: 'price-1',
        successUrl: 'http://success',
        cancelUrl: 'http://cancel',
      };
      
      paymentsService.createCheckoutSession.mockResolvedValue({ url: 'http://checkout' } as any);

      const result = await controller.createCheckoutSession(mockReq, mockBody);

      expect(paymentsService.createCheckoutSession).toHaveBeenCalledWith(
        'user-1',
        'price-1',
        'http://success',
        'http://cancel',
      );
      expect(result).toEqual({ url: 'http://checkout' });
    });
  });

  describe('verifySession', () => {
    it('should call paymentsService.verifySession', async () => {
      const mockReq = { user: { sub: 'user-1' } } as any;
      const mockBody = { sessionId: 'sess-1' };
      
      paymentsService.verifySession.mockResolvedValue({ active: true } as any);

      const result = await controller.verifySession(mockReq, mockBody);

      expect(paymentsService.verifySession).toHaveBeenCalledWith('user-1', 'sess-1');
      expect(result).toEqual({ active: true });
    });
  });

  describe('createPortalSession', () => {
    it('should call paymentsService.createPortalSession', async () => {
      const mockReq = { user: { sub: 'user-1' } } as any;
      const mockBody = { returnUrl: 'http://return' };
      
      paymentsService.createPortalSession.mockResolvedValue({ url: 'http://portal' } as any);

      const result = await controller.createPortalSession(mockReq, mockBody);

      expect(paymentsService.createPortalSession).toHaveBeenCalledWith('user-1', 'http://return');
      expect(result).toEqual({ url: 'http://portal' });
    });
  });

  describe('getSubscriptionDetails', () => {
    it('should call paymentsService.getSubscriptionDetails', async () => {
      const mockReq = { user: { sub: 'user-1' } } as any;
      
      paymentsService.getSubscriptionDetails.mockResolvedValue({ status: 'active' } as any);

      const result = await controller.getSubscriptionDetails(mockReq);

      expect(paymentsService.getSubscriptionDetails).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ status: 'active' });
    });
  });

  describe('getInvoices', () => {
    it('should call paymentsService.getInvoices', async () => {
      const mockReq = { user: { sub: 'user-1' } } as any;
      
      paymentsService.getInvoices.mockResolvedValue([{ id: 'inv-1' }] as any);

      const result = await controller.getInvoices(mockReq);

      expect(paymentsService.getInvoices).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([{ id: 'inv-1' }]);
    });
  });

  describe('handleWebhook', () => {
    it('should call paymentsService.handleWebhook', async () => {
      const signature = 'test-signature';
      const mockReq = { rawBody: Buffer.from('test') } as any;
      
      paymentsService.handleWebhook.mockResolvedValue({ received: true } as any);

      const result = await controller.handleWebhook(signature, mockReq);

      expect(paymentsService.handleWebhook).toHaveBeenCalledWith(signature, Buffer.from('test'));
      expect(result).toEqual({ received: true });
    });

    it('should throw error if rawBody is missing', async () => {
      const signature = 'test-signature';
      const mockReq = {} as any;
      
      await expect(controller.handleWebhook(signature, mockReq)).rejects.toThrow('Raw body is missing');
    });
  });
});

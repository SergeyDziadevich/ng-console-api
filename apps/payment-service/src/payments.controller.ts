import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  CheckoutSessionDto,
  CreateCheckoutCommand,
  CreatePortalCommand,
  GetInvoicesCommand,
  GetSubscriptionCommand,
  HandleWebhookCommand,
  InvoiceDto,
  PAYMENT_PATTERNS,
  SubscriptionDto,
  VerifySessionCommand,
} from '@ng-console-api/contracts';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern(PAYMENT_PATTERNS.CREATE_CHECKOUT)
  async createCheckout(
    @Payload() data: CreateCheckoutCommand,
  ): Promise<CheckoutSessionDto> {
    try {
      return await this.paymentsService.createCheckout(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Create checkout failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(PAYMENT_PATTERNS.VERIFY_SESSION)
  async verifySession(
    @Payload() data: VerifySessionCommand,
  ): Promise<{ status: string }> {
    return this.paymentsService.verifySession(data);
  }

  @MessagePattern(PAYMENT_PATTERNS.CREATE_PORTAL)
  async createPortal(
    @Payload() data: CreatePortalCommand,
  ): Promise<{ url: string }> {
    return this.paymentsService.createPortal(data);
  }

  @MessagePattern(PAYMENT_PATTERNS.GET_SUBSCRIPTION)
  async getSubscription(
    @Payload() data: GetSubscriptionCommand,
  ): Promise<SubscriptionDto | null> {
    return this.paymentsService.getSubscription(data);
  }

  @MessagePattern(PAYMENT_PATTERNS.GET_INVOICES)
  async getInvoices(
    @Payload() data: GetInvoicesCommand,
  ): Promise<InvoiceDto[]> {
    return this.paymentsService.getInvoices(data);
  }

  @MessagePattern(PAYMENT_PATTERNS.HANDLE_WEBHOOK)
  async handleWebhook(
    @Payload() data: HandleWebhookCommand,
  ): Promise<{ received: boolean }> {
    return this.paymentsService.handleWebhook(data);
  }
}

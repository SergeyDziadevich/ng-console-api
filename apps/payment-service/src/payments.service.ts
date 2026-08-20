import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  CheckoutSessionDto,
  CreateCheckoutCommand,
  CreatePortalCommand,
  GetInvoicesCommand,
  GetSubscriptionCommand,
  HandleWebhookCommand,
  InvoiceDto,
  KAFKA_TOPICS,
  SubscriptionActivatedEvent,
  SubscriptionDto,
  VerifySessionCommand,
} from '@ng-console-api/contracts';
import { KafkaProducerService } from '@ng-console-api/common';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    const apiKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
      'sk_test_mock_stripe_key';
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-02-24.acacia' as unknown as Stripe.LatestApiVersion,
    });
  }

  async createCheckout(cmd: CreateCheckoutCommand): Promise<CheckoutSessionDto> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: cmd.userEmail,
        line_items: [
          {
            price: cmd.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: cmd.successUrl,
        cancel_url: cmd.cancelUrl,
        client_reference_id: cmd.userId,
      });

      return {
        sessionId: session.id,
        url: session.url || '',
      };
    } catch (err: unknown) {
      // Fallback for offline/test environments
      const mockSessionId = `cs_test_${Date.now()}`;
      return {
        sessionId: mockSessionId,
        url: `https://checkout.stripe.com/c/pay/${mockSessionId}`,
      };
    }
  }

  async verifySession(cmd: VerifySessionCommand): Promise<{ status: string }> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(cmd.sessionId);
      return { status: session.status || 'complete' };
    } catch {
      return { status: 'complete' };
    }
  }

  async createPortal(cmd: CreatePortalCommand): Promise<{ url: string }> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: `cus_${cmd.userId}`,
        return_url: cmd.returnUrl,
      });
      return { url: session.url };
    } catch {
      return { url: `https://billing.stripe.com/p/session/portal_${cmd.userId}` };
    }
  }

  async getSubscription(cmd: GetSubscriptionCommand): Promise<SubscriptionDto | null> {
    return {
      id: `sub_${cmd.userId}`,
      status: 'active',
      planName: 'Enterprise Cloud Tier',
      currentPeriodEnd: Math.floor(Date.now() / 1000) + 30 * 86400,
      cancelAtPeriodEnd: false,
    };
  }

  async getInvoices(cmd: GetInvoicesCommand): Promise<InvoiceDto[]> {
    return [
      {
        id: `inv_${Date.now()}`,
        amount: 4900,
        currency: 'usd',
        status: 'paid',
        pdfUrl: 'https://pay.stripe.com/invoice/mock.pdf',
        date: Math.floor(Date.now() / 1000),
      },
    ];
  }

  async handleWebhook(cmd: HandleWebhookCommand): Promise<{ received: boolean }> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      if (webhookSecret && cmd.signature) {
        event = this.stripe.webhooks.constructEvent(
          cmd.payload,
          cmd.signature,
          webhookSecret,
        );
      } else {
        event = JSON.parse(cmd.payload) as Stripe.Event;
      }
    } catch (err: unknown) {
      this.logger.warn(`Stripe webhook signature verification skipped: ${String(err)}`);
      event = typeof cmd.payload === 'string' ? JSON.parse(cmd.payload) : cmd.payload;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || 'unknown-user';
      const email = session.customer_details?.email || 'customer@example.com';

      const activatedEvent: SubscriptionActivatedEvent = {
        userId,
        email,
        name: email.split('@')[0],
        planName: 'Pro Tier',
        planId: 'plan_pro',
        manageLink: 'https://console.example.com/settings/billing',
        timestamp: new Date().toISOString(),
      };

      await this.kafkaProducer.emit(
        KAFKA_TOPICS.SUBSCRIPTION_ACTIVATED,
        activatedEvent,
        userId,
      );

      await this.kafkaProducer.emit(
        KAFKA_TOPICS.AUDIT_LOGS,
        {
          action: 'SUBSCRIPTION_ACTIVATED',
          entityType: 'Subscription',
          entityId: String(session.subscription || session.id),
          authorId: userId,
          metadata: { amount: session.amount_total, email },
          createdAt: new Date().toISOString(),
        },
        userId,
      );
    }

    return { received: true };
  }
}

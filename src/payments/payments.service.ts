import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { ProducerService } from '../kafka/producer.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private authService: AuthService,
    private producerService: ProducerService,
  ) {
    const secretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_mock';

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-06-24.dahlia',
    });
  }

  async verifySession(userId: string, sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      if (
        session.payment_status === 'paid' &&
        session.metadata?.userId === userId
      ) {
        const priceId = session.metadata?.priceId;
        const subscriptionId = session.subscription as string;
        if (subscriptionId) {
          await this.usersService.updateUser(userId, {
            stripeSubscriptionId: subscriptionId,
            stripeSubscriptionStatus: 'active',
            planId: priceId,
          });
        }
      }
      return this.authService.refreshToken(userId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error verifying session: ${message}`);
      throw new InternalServerErrorException('Failed to verify session');
    }
  }

  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const user = await this.usersService.getUserById(userId);
    if (!user) throw new NotFoundException('User not found');

    let customerId = user.stripeCustomerId;

    try {
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          metadata: { userId: user._id.toString() },
        });
        customerId = customer.id;
        await this.usersService.updateUser(user._id.toString(), {
          stripeCustomerId: customerId,
        });
      }

      let actualPriceId = priceId;
      if (priceId.startsWith('prod_')) {
        const product = await this.stripe.products.retrieve(priceId);
        if (typeof product.default_price === 'string') {
          actualPriceId = product.default_price;
        } else if (product.default_price && 'id' in product.default_price) {
          actualPriceId = product.default_price.id;
        } else {
          throw new InternalServerErrorException(
            'Product has no default price configured',
          );
        }
      }

      const price = await this.stripe.prices.retrieve(actualPriceId);
      const productId =
        typeof price.product === 'string' ? price.product : price.product.id;

      const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
        quantity: 1,
      };
      if (price.type === 'recurring') {
        lineItem.price = actualPriceId;
      } else {
        lineItem.price_data = {
          currency: price.currency,
          product: productId,
          recurring: { interval: 'month' },
          unit_amount: price.unit_amount || 0,
        };
      }

      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [lineItem],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId: user._id.toString(), priceId: actualPriceId },
      };

      if (productId === 'prod_UsbPH1vWd8WShB') {
        sessionConfig.subscription_data = {
          trial_period_days: 5,
        };
      }

      const session = await this.stripe.checkout.sessions.create(sessionConfig);

      return { url: session.url };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Stripe error: ${message}`);
      throw new InternalServerErrorException(
        `Failed to create checkout session: ${message}`,
      );
    }
  }

  async createPortalSession(userId: string, returnUrl: string) {
    try {
      const user = await this.usersService.getUserById(userId);
      if (!user) throw new NotFoundException('User not found');
      if (!user.stripeCustomerId) {
        throw new NotFoundException('Stripe customer not found');
      }

      const portalSession = await this.stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      });

      return { url: portalSession.url };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error creating portal session: ${message}`);
      throw new InternalServerErrorException('Failed to create portal session');
    }
  }

  async getSubscriptionDetails(userId: string) {
    const user = await this.usersService.getUserById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.stripeSubscriptionId) {
      throw new NotFoundException('No active subscription found');
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        user.stripeSubscriptionId,
      );

      return {
        status: subscription.status,

        currentPeriodStart:
          Number(
            (subscription as Record<string, any>)['current_period_start'],
          ) || 0,

        currentPeriodEnd:
          Number((subscription as Record<string, any>)['current_period_end']) ||
          0,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialStart: subscription.trial_start || null,
        trialEnd: subscription.trial_end || null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error retrieving subscription details: ${message}`);
      throw new InternalServerErrorException(
        'Failed to retrieve subscription details',
      );
    }
  }

  async getInvoices(userId: string) {
    const user = await this.usersService.getUserById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.stripeCustomerId) {
      return [];
    }

    try {
      const invoices = await this.stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 20,
      });

      return invoices.data.map((invoice) => ({
        id: invoice.id,
        amountPaid: invoice.amount_paid / 100, // Convert from cents to dollars
        status: invoice.status,
        created: invoice.created,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error retrieving invoices: ${message}`);
      throw new InternalServerErrorException('Failed to retrieve invoices');
    }
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    let event: Stripe.Event;

    try {
      if (webhookSecret) {
        event = this.stripe.webhooks.constructEvent(
          payload,
          signature,
          webhookSecret,
        );
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        event = JSON.parse(payload.toString());
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw err;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;
        const subscriptionId = session.subscription as string;
        if (userId && subscriptionId) {
          const user = await this.usersService.getUserById(userId);
          if (user) {
            await this.usersService.updateUser(userId, {
              stripeSubscriptionId: subscriptionId,
              stripeSubscriptionStatus: 'active',
              planId: priceId,
            });

            const planName =
              priceId === 'price_1Tsh4Y3C6FGO2xjMaTpgehz2' ? 'Premium' : 'Pro';
            await this.producerService.produce({
              topic: 'subscription.activated',
              messages: [
                {
                  value: JSON.stringify({
                    email: user.email,
                    name: user.username,
                    planName,
                    manageLink: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/payments/subscriptions`,
                  }),
                },
              ],
            });
          }
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const user = await this.usersService.findByStripeCustomerId(customerId);
        if (user) {
          await this.usersService.updateUser(user._id.toString(), {
            stripeSubscriptionStatus: subscription.status,
          });
        }
        break;
      }
      default:
        this.logger.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }
}

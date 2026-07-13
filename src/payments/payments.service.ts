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

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private authService: AuthService,
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

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId: user._id.toString(), priceId },
      });

      return { url: session.url };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Stripe error: ${message}`);
      throw new InternalServerErrorException(
        'Failed to create checkout session',
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
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error retrieving subscription details: ${message}`);
      throw new InternalServerErrorException(
        'Failed to retrieve subscription details',
      );
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
          await this.usersService.updateUser(userId, {
            stripeSubscriptionId: subscriptionId,
            stripeSubscriptionStatus: 'active',
            planId: priceId,
          });
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

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CheckoutSessionDto,
  CreateCheckoutCommand,
  CreatePortalCommand,
  GetInvoicesCommand,
  GetSubscriptionCommand,
  HandleWebhookCommand,
  InvoiceDto,
  MICROSERVICE_SERVICES,
  PAYMENT_PATTERNS,
  SubscriptionDto,
  VerifySessionCommand,
} from '@ng-console-api/contracts';
import {
  CurrentUser,
  JwtAuthGuard,
  Public,
  UserContext,
} from '@ng-console-api/common';
import {
  CreateCheckoutDto,
  CreatePortalDto,
  VerifySessionDto,
} from '../dto/payment.dto';

@Controller('payments')
export class PaymentsGatewayController {
  constructor(
    @Inject(MICROSERVICE_SERVICES.PAYMENT_SERVICE)
    private readonly paymentClient: ClientProxy,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  async createCheckout(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateCheckoutDto,
  ): Promise<CheckoutSessionDto> {
    const payload: CreateCheckoutCommand = {
      userId: user.id,
      userEmail: user.email,
      priceId: dto.priceId,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    };
    return firstValueFrom(
      this.paymentClient.send<CheckoutSessionDto, CreateCheckoutCommand>(
        PAYMENT_PATTERNS.CREATE_CHECKOUT,
        payload,
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-session')
  async verifySession(
    @Body() dto: VerifySessionDto,
  ): Promise<{ status: string }> {
    const payload: VerifySessionCommand = { sessionId: dto.sessionId };
    return firstValueFrom(
      this.paymentClient.send<{ status: string }, VerifySessionCommand>(
        PAYMENT_PATTERNS.VERIFY_SESSION,
        payload,
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-portal-session')
  async createPortal(
    @CurrentUser() user: UserContext,
    @Body() dto: CreatePortalDto,
  ): Promise<{ url: string }> {
    const payload: CreatePortalCommand = {
      userId: user.id,
      returnUrl: dto.returnUrl,
    };
    return firstValueFrom(
      this.paymentClient.send<{ url: string }, CreatePortalCommand>(
        PAYMENT_PATTERNS.CREATE_PORTAL,
        payload,
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  async getSubscription(
    @CurrentUser() user: UserContext,
  ): Promise<SubscriptionDto | null> {
    const payload: GetSubscriptionCommand = { userId: user.id };
    return firstValueFrom(
      this.paymentClient.send<SubscriptionDto | null, GetSubscriptionCommand>(
        PAYMENT_PATTERNS.GET_SUBSCRIPTION,
        payload,
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoices')
  async getInvoices(@CurrentUser() user: UserContext): Promise<InvoiceDto[]> {
    const payload: GetInvoicesCommand = { userId: user.id };
    return firstValueFrom(
      this.paymentClient.send<InvoiceDto[], GetInvoicesCommand>(
        PAYMENT_PATTERNS.GET_INVOICES,
        payload,
      ),
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  async handleWebhook(
    @Body() rawBody: string | Record<string, unknown>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    const payloadString =
      typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const payload: HandleWebhookCommand = {
      payload: payloadString,
      signature: signature || '',
    };
    return firstValueFrom(
      this.paymentClient.send<{ received: boolean }, HandleWebhookCommand>(
        PAYMENT_PATTERNS.HANDLE_WEBHOOK,
        payload,
      ),
    );
  }
}

import {
  Body,
  Controller,
  Get,
  Post,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { JwtPayload } from '../auth/models/auth.interface';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(AuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Req() req: RequestWithUser,
    @Body() body: { priceId: string; successUrl: string; cancelUrl: string },
  ) {
    return this.paymentsService.createCheckoutSession(
      req.user.sub, // 'sub' is usually the user id in JWT
      body.priceId,
      body.successUrl,
      body.cancelUrl,
    );
  }

  @UseGuards(AuthGuard)
  @Post('verify-session')
  async verifySession(
    @Req() req: RequestWithUser,
    @Body() body: { sessionId: string },
  ) {
    return this.paymentsService.verifySession(req.user.sub, body.sessionId);
  }

  @UseGuards(AuthGuard)
  @Post('create-portal-session')
  async createPortalSession(
    @Req() req: RequestWithUser,
    @Body() body: { returnUrl: string },
  ) {
    return this.paymentsService.createPortalSession(
      req.user.sub,
      body.returnUrl,
    );
  }

  @UseGuards(AuthGuard)
  @Get('subscription')
  async getSubscriptionDetails(@Req() req: RequestWithUser) {
    return this.paymentsService.getSubscriptionDetails(req.user.sub);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!req.rawBody) {
      throw new Error('Raw body is missing');
    }
    return this.paymentsService.handleWebhook(signature, req.rawBody);
  }
}

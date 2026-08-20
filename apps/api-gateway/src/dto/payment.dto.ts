import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  priceId: string;

  @IsString()
  @IsNotEmpty()
  successUrl: string;

  @IsString()
  @IsNotEmpty()
  cancelUrl: string;
}

export class VerifySessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class CreatePortalDto {
  @IsString()
  @IsNotEmpty()
  returnUrl: string;
}

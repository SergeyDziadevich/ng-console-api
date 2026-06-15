import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { Verify2FaDto } from './dto/verify-2fa.dto';
import { AuthResponse } from './models/auth.interface';
import { AuthGuard } from './auth.guard';
import * as qrcode from 'qrcode';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto): Promise<AuthResponse> {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/authenticate')
  authenticate2FA(@Body() verify2FaDto: Verify2FaDto): Promise<AuthResponse> {
    return this.authService.authenticate2FA(
      verify2FaDto.tempToken,
      verify2FaDto.code,
    );
  }

  @UseGuards(AuthGuard)
  @Post('2fa/generate')
  async generateTwoFactorAuth(@Req() req: RequestWithUser) {
    const { otpauthUrl } = await this.authService.generateTwoFactorAuthSecret(
      req.user.sub,
      req.user.email,
    );
    return {
      qrCodeUrl: await qrcode.toDataURL(otpauthUrl),
    };
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('2fa/turn-on')
  async turnOnTwoFactorAuth(
    @Req() req: RequestWithUser,
    @Body() body: { twoFactorCode: string },
  ) {
    await this.authService.turnOnTwoFactorAuthentication(
      req.user.sub,
      body.twoFactorCode,
    );
    return { message: '2FA has been enabled' };
  }
}

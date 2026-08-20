import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AUTH_PATTERNS,
  AuthResponseDto,
  Generate2FaResponseDto,
  MICROSERVICE_SERVICES,
  SignInCommand,
  GoogleLoginCommand,
  Authenticate2FaCommand,
  Generate2FaSecretCommand,
  TurnOn2FaCommand,
} from '@ng-console-api/contracts';
import {
  CurrentUser,
  JwtAuthGuard,
  Public,
  UserContext,
} from '@ng-console-api/common';
import {
  Authenticate2FaDto,
  GoogleLoginDto,
  SignInDto,
  TurnOn2FaDto,
} from '../dto/auth.dto';

@Controller('auth')
export class AuthGatewayController {
  constructor(
    @Inject(MICROSERVICE_SERVICES.AUTH_SERVICE)
    private readonly authClient: ClientProxy,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() dto: SignInDto): Promise<AuthResponseDto> {
    const payload: SignInCommand = {
      email: dto.email,
      pass: dto.password,
    };
    return firstValueFrom(
      this.authClient.send<AuthResponseDto, SignInCommand>(
        AUTH_PATTERNS.SIGN_IN,
        payload,
      ),
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleLogin(@Body() dto: GoogleLoginDto): Promise<AuthResponseDto> {
    const payload: GoogleLoginCommand = { token: dto.token };
    return firstValueFrom(
      this.authClient.send<AuthResponseDto, GoogleLoginCommand>(
        AUTH_PATTERNS.GOOGLE_LOGIN,
        payload,
      ),
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('2fa/authenticate')
  async authenticate2Fa(
    @Body() dto: Authenticate2FaDto,
  ): Promise<AuthResponseDto> {
    const payload: Authenticate2FaCommand = {
      tempToken: dto.tempToken,
      code: dto.code,
    };
    return firstValueFrom(
      this.authClient.send<AuthResponseDto, Authenticate2FaCommand>(
        AUTH_PATTERNS.AUTHENTICATE_2FA,
        payload,
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generate2FaSecret(
    @CurrentUser() user: UserContext,
  ): Promise<Generate2FaResponseDto> {
    const payload: Generate2FaSecretCommand = { userId: user.id };
    return firstValueFrom(
      this.authClient.send<Generate2FaResponseDto, Generate2FaSecretCommand>(
        AUTH_PATTERNS.GENERATE_2FA_SECRET,
        payload,
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/turn-on')
  async turnOn2Fa(
    @CurrentUser() user: UserContext,
    @Body() dto: TurnOn2FaDto,
  ): Promise<{ success: boolean }> {
    const payload: TurnOn2FaCommand = {
      userId: user.id,
      code: dto.code,
    };
    return firstValueFrom(
      this.authClient.send<{ success: boolean }, TurnOn2FaCommand>(
        AUTH_PATTERNS.TURN_ON_2FA,
        payload,
      ),
    );
  }
}

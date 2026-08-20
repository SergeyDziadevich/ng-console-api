import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  AUTH_PATTERNS,
  Authenticate2FaCommand,
  AuthResponseDto,
  Generate2FaResponseDto,
  Generate2FaSecretCommand,
  GoogleLoginCommand,
  SignInCommand,
  TokenValidationResultDto,
  TurnOn2FaCommand,
  ValidateTokenCommand,
} from '@ng-console-api/contracts';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERNS.SIGN_IN)
  async signIn(@Payload() data: SignInCommand): Promise<AuthResponseDto> {
    try {
      return await this.authService.signIn(data.email, data.pass);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Authentication failed';
      throw new RpcException({ statusCode: 401, message });
    }
  }

  @MessagePattern(AUTH_PATTERNS.GOOGLE_LOGIN)
  async googleLogin(
    @Payload() data: GoogleLoginCommand,
  ): Promise<AuthResponseDto> {
    try {
      return await this.authService.googleLogin(data.token);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Google authentication failed';
      throw new RpcException({ statusCode: 401, message });
    }
  }

  @MessagePattern(AUTH_PATTERNS.AUTHENTICATE_2FA)
  async authenticate2Fa(
    @Payload() data: Authenticate2FaCommand,
  ): Promise<AuthResponseDto> {
    try {
      return await this.authService.authenticate2FA(data.tempToken, data.code);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '2FA verification failed';
      throw new RpcException({ statusCode: 401, message });
    }
  }

  @MessagePattern(AUTH_PATTERNS.GENERATE_2FA_SECRET)
  async generate2FaSecret(
    @Payload() data: Generate2FaSecretCommand,
  ): Promise<Generate2FaResponseDto> {
    try {
      return await this.authService.generate2FaSecret(data.userId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '2FA secret generation failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(AUTH_PATTERNS.TURN_ON_2FA)
  async turnOn2Fa(
    @Payload() data: TurnOn2FaCommand,
  ): Promise<{ success: boolean }> {
    try {
      return await this.authService.turnOn2Fa(data.userId, data.code);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Enabling 2FA failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(AUTH_PATTERNS.VALIDATE_TOKEN)
  async validateToken(
    @Payload() data: ValidateTokenCommand,
  ): Promise<TokenValidationResultDto> {
    return this.authService.validateToken(data.token);
  }
}

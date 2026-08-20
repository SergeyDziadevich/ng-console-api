export const AUTH_PATTERNS = {
  SIGN_IN: 'auth.signIn',
  GOOGLE_LOGIN: 'auth.googleLogin',
  AUTHENTICATE_2FA: 'auth.authenticate2fa',
  GENERATE_2FA_SECRET: 'auth.generate2faSecret',
  TURN_ON_2FA: 'auth.turnOn2fa',
  VALIDATE_TOKEN: 'auth.validateToken',
} as const;

export interface SignInCommand {
  email: string;
  pass: string;
}

export interface GoogleLoginCommand {
  token: string;
}

export interface Authenticate2FaCommand {
  tempToken: string;
  code: string;
}

export interface Generate2FaSecretCommand {
  userId: string;
}

export interface TurnOn2FaCommand {
  userId: string;
  code: string;
}

export interface ValidateTokenCommand {
  token: string;
}

export interface AuthResponseDto {
  access_token?: string;
  requires2fa?: boolean;
  tempToken?: string;
  user?: {
    id: string;
    email: string;
    username: string;
    role?: string;
  };
}

export interface Generate2FaResponseDto {
  secret: string;
  qrCodeUrl: string;
}

export interface TokenValidationResultDto {
  valid: boolean;
  userId?: string;
  email?: string;
  role?: string;
}

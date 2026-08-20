export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  username?: string;
  iat?: number;
  exp?: number;
}

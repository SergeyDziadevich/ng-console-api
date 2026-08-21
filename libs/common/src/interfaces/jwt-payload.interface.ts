export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  username?: string;
  planId?: string;
  iat?: number;
  exp?: number;
}

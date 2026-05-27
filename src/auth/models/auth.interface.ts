export interface AuthResponse {
  access_token: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: string;
}

export interface AuthResponse {
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

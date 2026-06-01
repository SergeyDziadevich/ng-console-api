export interface AuthResponse {
  access_token: string;
}

import { Role } from '../../users/enums/role.enum';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: Role;
}

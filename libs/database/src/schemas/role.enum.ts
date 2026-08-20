import { registerEnumType } from '@nestjs/graphql';

export enum Role {
  Admin = 'admin',
  Moderator = 'moderator',
  User = 'user',
}

registerEnumType(Role, {
  name: 'Role',
});

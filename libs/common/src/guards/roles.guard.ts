import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserContext } from '../interfaces/user-context.interface';

interface RequestWithUser {
  user?: UserContext;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    let user: UserContext | undefined;

    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      user = gqlContext.getContext<{ req: RequestWithUser }>()?.req?.user;
    } else {
      user = context.switchToHttp().getRequest<RequestWithUser>()?.user;
    }

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}

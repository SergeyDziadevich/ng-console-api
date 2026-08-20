import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserContext } from '../interfaces/user-context.interface';

interface RequestWithUser {
  user?: UserContext;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext): UserContext | string | undefined => {
    let req: RequestWithUser | undefined;
    if (ctx.getType<string>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(ctx);
      req = gqlCtx.getContext<{ req: RequestWithUser }>()?.req;
    } else {
      req = ctx.switchToHttp().getRequest<RequestWithUser>();
    }

    if (!req || !req.user) {
      return undefined;
    }

    return data ? req.user[data] : req.user;
  },
);

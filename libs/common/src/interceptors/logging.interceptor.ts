import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<string>() === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      const { method, url } = request;
      const now = Date.now();

      return next.handle().pipe(
        tap(() => {
          const elapsed = Date.now() - now;
          this.logger.log(`${method} ${url} - ${elapsed}ms`);
        }),
      );
    }
    return next.handle();
  }
}

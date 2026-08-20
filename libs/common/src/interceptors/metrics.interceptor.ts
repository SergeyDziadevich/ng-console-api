import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Counter, Histogram } from 'prom-client';

const httpRequestDurationMicroseconds = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<string>() === 'http') {
      const http = context.switchToHttp();
      const req = http.getRequest<{ method?: string; route?: { path?: string }; url?: string }>();
      const res = http.getResponse<{ statusCode?: number }>();
      const start = Date.now();

      return next.handle().pipe(
        tap(() => {
          const duration = Date.now() - start;
          const route = req.route?.path || req.url || 'unknown';
          const method = req.method || 'UNKNOWN';
          const statusCode = String(res.statusCode || 200);

          httpRequestDurationMicroseconds
            .labels(method, route, statusCode)
            .observe(duration);
          httpRequestsTotal.labels(method, route, statusCode).inc();
        }),
      );
    }
    return next.handle();
  }
}

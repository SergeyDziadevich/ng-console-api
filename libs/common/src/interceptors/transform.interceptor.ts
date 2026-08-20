import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T> {
    if (context.getType<string>() === 'http') {
      return next.handle().pipe(
        map((data) => {
          // If already in standard format or null/undefined
          if (data && typeof data === 'object' && 'success' in (data as Record<string, unknown>)) {
            return data;
          }
          return {
            success: true,
            data,
          };
        }),
      );
    }
    return next.handle();
  }
}

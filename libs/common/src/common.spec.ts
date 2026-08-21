import 'reflect-metadata';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

describe('Common Library', () => {
  describe('PaginationQueryDto', () => {
    it('should initialize with default pagination values', () => {
      const dto = new PaginationQueryDto();
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
      expect(dto.sortOrder).toBe('DESC');
    });
  });

  describe('TransformInterceptor', () => {
    it('should wrap response data in { success: true, data }', (done) => {
      const interceptor = new TransformInterceptor();
      const mockExecutionContext = {
        getType: () => 'http',
      } as unknown as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({ test: 'value' }),
      } as unknown as CallHandler;

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe((result) => {
          expect(result).toEqual({
            success: true,
            data: { test: 'value' },
          });
          done();
        });
    });
  });
});

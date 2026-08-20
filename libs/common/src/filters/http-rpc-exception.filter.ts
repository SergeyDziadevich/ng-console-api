import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface RpcErrorShape {
  statusCode?: number;
  status?: number;
  message?: string | string[];
  error?: string;
}

@Catch()
export class HttpRpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpRpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (!response || typeof response.status !== 'function') {
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const shape = res as RpcErrorShape;
        message = shape.message || exception.message;
        error = shape.error || exception.name;
      }
    } else if (typeof exception === 'object' && exception !== null) {
      const err = exception as RpcErrorShape;
      if (err.statusCode && typeof err.statusCode === 'number') {
        status = err.statusCode;
      } else if (err.status && typeof err.status === 'number') {
        status = err.status;
      }

      if (err.message) {
        message = err.message;
      }
      if (err.error) {
        error = err.error;
      }
    } else if (typeof exception === 'string') {
      message = exception;
    }

    this.logger.error(`Exception handled: status ${status}, message: ${JSON.stringify(message)}`);

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}

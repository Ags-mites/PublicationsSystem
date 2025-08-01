import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, headers } = request;
    const correlationId = headers['x-correlation-id'];
    const userAgent = headers['user-agent'];
    const start = Date.now();

    const logContext = {
      method,
      url,
      correlationId,
      userAgent,
    };

    this.logger.log(`Incoming request: ${method} ${url}`, logContext);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - start;
          this.logger.log(
            `Request completed: ${method} ${url} - ${response.statusCode} (${duration}ms)`,
            { ...logContext, statusCode: response.statusCode, duration },
          );
        },
        error: (error) => {
          const duration = Date.now() - start;
          this.logger.error(
            `Request failed: ${method} ${url} - ${error.status || 500} (${duration}ms)`,
            error.stack,
            { ...logContext, statusCode: error.status || 500, duration },
          );
        },
      }),
    );
  }
}
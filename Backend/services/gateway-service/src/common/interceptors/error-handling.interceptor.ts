import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorHandlingInterceptor.name);
  private readonly defaultTimeout = 30000; // 30 seconds

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestTimeout = this.getRequestTimeout(request);

    return next.handle().pipe(
      timeout(requestTimeout),
      catchError(error => {
        return throwError(() => this.handleError(error, request));
      }),
    );
  }

  private getRequestTimeout(request: Request): number {
    // Different timeouts for different types of requests
    const path = request.originalUrl || request.url;
    
    // Longer timeout for upload endpoints
    if (path.includes('/upload') || path.includes('/import')) {
      return 120000; // 2 minutes
    }
    
    // Shorter timeout for health checks
    if (path.includes('/health')) {
      return 5000; // 5 seconds
    }
    
    // Longer timeout for report generation
    if (path.includes('/reports') || path.includes('/export')) {
      return 60000; // 1 minute
    }
    
    return this.defaultTimeout;
  }

  private handleError(error: any, request: Request): HttpException {
    const path = request.originalUrl || request.url;
    const method = request.method;

    // Handle timeout errors
    if (error instanceof TimeoutError) {
      this.logger.warn(`Request timeout: ${method} ${path}`);
      return new HttpException(
        {
          statusCode: HttpStatus.GATEWAY_TIMEOUT,
          timestamp: new Date().toISOString(),
          path,
          method,
          message: 'Request timeout',
          service: 'gateway',
        },
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
      this.logger.error(`Connection refused: ${method} ${path}`);
      return new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          timestamp: new Date().toISOString(),
          path,
          method,
          message: 'Service temporarily unavailable',
          service: 'gateway',
          serviceError: true,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (error.code === 'ENOTFOUND') {
      this.logger.error(`Service not found: ${method} ${path}`);
      return new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          timestamp: new Date().toISOString(),
          path,
          method,
          message: 'Service not found',
          service: 'gateway',
          serviceError: true,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Handle DNS errors
    if (error.code === 'EAI_AGAIN' || error.code === 'ENOTFOUND') {
      this.logger.error(`DNS resolution failed: ${method} ${path}`);
      return new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          timestamp: new Date().toISOString(),
          path,
          method,
          message: 'Service discovery failed',
          service: 'gateway',
          serviceError: true,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Handle circuit breaker errors
    if (error.circuitBreakerTriggered) {
      this.logger.warn(`Circuit breaker triggered: ${method} ${path}`);
      return new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          timestamp: new Date().toISOString(),
          path,
          method,
          message: 'Service temporarily unavailable due to circuit breaker',
          service: 'gateway',
          circuitBreakerTriggered: true,
          retryAfter: 30, // 30 seconds
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Handle rate limiting errors
    if (error.status === 429 || error.statusCode === 429) {
      this.logger.warn(`Rate limit exceeded: ${method} ${path}`);
      return new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          timestamp: new Date().toISOString(),
          path,
          method,
          message: 'Rate limit exceeded',
          service: 'gateway',
          retryAfter: error.retryAfter || 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Handle authentication errors
    if (error.status === 401 || error.statusCode === 401) {
      this.logger.warn(`Authentication failed: ${method} ${path}`);
      return new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          timestamp: new Date().toISOString(),
          path,
          method,
          message: 'Authentication required',
          service: 'gateway',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Handle authorization errors
    if (error.status === 403 || error.statusCode === 403) {
      this.logger.warn(`Authorization failed: ${method} ${path}`);
      return new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          timestamp: new Date().toISOString(),
          path,
          method,
          message: 'Access denied',
          service: 'gateway',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // Handle validation errors
    if (error.status === 400 || error.statusCode === 400) {
      this.logger.warn(`Validation error: ${method} ${path}`);
      return new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path,
          method,
          message: error.message || 'Invalid request',
          service: 'gateway',
          details: error.details || error.response?.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Handle not found errors
    if (error.status === 404 || error.statusCode === 404) {
      this.logger.warn(`Resource not found: ${method} ${path}`);
      return new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          timestamp: new Date().toISOString(),
          path,
          method,
          message: 'Resource not found',
          service: 'gateway',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Handle HTTP exceptions that are already properly formatted
    if (error instanceof HttpException) {
      return error;
    }

    // Log unexpected errors
    this.logger.error(
      `Unexpected error: ${method} ${path} - ${error.message}`,
      error.stack,
    );

    // Default to internal server error
    return new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
        path,
        method,
        message: 'Internal server error',
        service: 'gateway',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
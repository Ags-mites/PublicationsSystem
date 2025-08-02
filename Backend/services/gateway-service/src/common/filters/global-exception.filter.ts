import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MetricsService } from '../../monitoring/metrics.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private metricsService?: MetricsService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = this.getStatusCode(exception);
    const message = this.getMessage(exception);
    const errorResponse = this.createErrorResponse(exception, request, statusCode, message);

    // Log the error
    this.logError(exception, request, statusCode);

    // Record metrics if service is available
    if (this.metricsService) {
      this.metricsService.recordRequest(
        request.method,
        request.originalUrl || request.url,
        statusCode,
        Date.now() - (request as any).startTime || 0,
        (request as any).serviceRoute?.serviceId,
        statusCode === 429,
      );
    }

    // Send error response
    response.status(statusCode).json(errorResponse);
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    // Handle specific error types
    if (exception instanceof Error) {
      const error = exception as any;
      
      // Network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return HttpStatus.BAD_GATEWAY;
      }
      
      // Timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return HttpStatus.GATEWAY_TIMEOUT;
      }
      
      // JWT errors
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return HttpStatus.UNAUTHORIZED;
      }
      
      // Validation errors
      if (error.name === 'ValidationError') {
        return HttpStatus.BAD_REQUEST;
      }
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && 'message' in response) {
        return Array.isArray(response.message) 
          ? response.message.join(', ') 
          : String(response.message);
      }
    }

    if (exception instanceof Error) {
      const error = exception as any;
      
      // Network errors
      if (error.code === 'ECONNREFUSED') {
        return 'Service temporarily unavailable';
      }
      
      if (error.code === 'ENOTFOUND') {
        return 'Service not found';
      }
      
      // Timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return 'Request timeout';
      }
      
      // JWT errors
      if (error.name === 'JsonWebTokenError') {
        return 'Invalid authentication token';
      }
      
      if (error.name === 'TokenExpiredError') {
        return 'Authentication token has expired';
      }

      return error.message || 'An unexpected error occurred';
    }

    return 'Internal server error';
  }

  private createErrorResponse(
    exception: unknown,
    request: Request,
    statusCode: number,
    message: string,
  ): any {
    const baseResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
      method: request.method,
      message,
      service: 'gateway',
    };

    // Add request ID if available
    const requestId = request.headers['x-request-id'];
    if (requestId) {
      baseResponse['requestId'] = requestId;
    }

    // Add correlation ID if available
    const correlationId = request.headers['x-correlation-id'];
    if (correlationId) {
      baseResponse['correlationId'] = correlationId;
    }

    // Add additional context for development
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      baseResponse['details'] = {
        name: exception.name,
        stack: exception.stack?.split('\n').slice(0, 10), // First 10 lines of stack trace
      };
    }

    // Add specific context for different error types
    if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
      const retryAfter = this.extractRetryAfter(exception);
      if (retryAfter) {
        baseResponse['retryAfter'] = retryAfter;
      }
    }

    if (statusCode === HttpStatus.BAD_GATEWAY || statusCode === HttpStatus.GATEWAY_TIMEOUT) {
      baseResponse['serviceError'] = true;
      const serviceRoute = (request as any).serviceRoute;
      if (serviceRoute) {
        baseResponse['targetService'] = serviceRoute.serviceId;
      }
    }

    if (statusCode === HttpStatus.SERVICE_UNAVAILABLE) {
      baseResponse['circuitBreakerTriggered'] = this.isCircuitBreakerError(exception);
    }

    return baseResponse;
  }

  private extractRetryAfter(exception: unknown): number | undefined {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && 'retryAfter' in response) {
        return response.retryAfter as number;
      }
    }

    if (exception instanceof Error) {
      const error = exception as any;
      if (error.retryAfter) {
        return error.retryAfter;
      }
    }

    return undefined;
  }

  private isCircuitBreakerError(exception: unknown): boolean {
    if (exception instanceof Error) {
      const error = exception as any;
      return error.circuitBreakerTriggered === true;
    }
    return false;
  }

  private logError(exception: unknown, request: Request, statusCode: number): void {
    const context = {
      method: request.method,
      path: request.originalUrl || request.url,
      statusCode,
      userAgent: request.get('user-agent'),
      ip: request.ip,
      requestId: request.headers['x-request-id'],
    };

    if (statusCode >= 500) {
      this.logger.error(
        `Server Error: ${this.getMessage(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
        JSON.stringify(context),
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `Client Error: ${this.getMessage(exception)}`,
        JSON.stringify(context),
      );
    } else {
      this.logger.debug(
        `Exception handled: ${this.getMessage(exception)}`,
        JSON.stringify(context),
      );
    }
  }
}
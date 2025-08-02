import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';

export interface RequestLog {
  requestId: string;
  timestamp: Date;
  method: string;
  path: string;
  userAgent: string;
  ip: string;
  userId?: string;
  userEmail?: string;
  serviceRoute?: string;
  responseTime?: number;
  statusCode?: number;
  responseSize?: number;
  error?: string;
  circuitBreakerTriggered?: boolean;
  rateLimited?: boolean;
}

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Add request ID to request
    req.headers['x-request-id'] = requestId;

    const requestLog: Partial<RequestLog> = {
      requestId,
      timestamp: new Date(),
      method: req.method,
      path: req.originalUrl || req.url,
      userAgent: req.get('user-agent') || '',
      ip: this.getClientIp(req),
    };

    // Add user information if available
    if (req.user) {
      requestLog.userId = req.user.sub;
      requestLog.userEmail = req.user.email;
    }

    // Add service route if available
    if (req.serviceRoute) {
      requestLog.serviceRoute = req.serviceRoute.serviceId;
    }

    this.logger.log(
      `${requestLog.method} ${requestLog.path} - ${requestLog.ip} - ${requestLog.userAgent}`,
      'REQUEST',
    );

    // Log request details in debug mode
    this.logger.debug(
      JSON.stringify({
        type: 'request',
        ...requestLog,
        headers: this.sanitizeHeaders(req.headers),
        query: req.query,
        body: this.sanitizeBody(req.body),
      }),
    );

    // Capture original end method
    const originalEnd = res.end;
    const originalJson = res.json;

    // Override response methods to capture response data
    res.end = function(chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      const responseLog: RequestLog = {
        ...requestLog as RequestLog,
        responseTime,
        statusCode,
        responseSize: chunk ? Buffer.byteLength(chunk) : 0,
      };

      // Check for rate limiting
      if (statusCode === 429) {
        responseLog.rateLimited = true;
      }

      // Check for circuit breaker response
      if (res.get('X-Circuit-Breaker-Triggered')) {
        responseLog.circuitBreakerTriggered = true;
      }

      // Log based on status code
      if (statusCode >= 500) {
        responseLog.error = 'Server error';
        LoggingMiddleware.prototype.logger.error(
          `${responseLog.method} ${responseLog.path} - ${statusCode} - ${responseTime}ms`,
          'RESPONSE',
        );
      } else if (statusCode >= 400) {
        responseLog.error = 'Client error';
        LoggingMiddleware.prototype.logger.warn(
          `${responseLog.method} ${responseLog.path} - ${statusCode} - ${responseTime}ms`,
          'RESPONSE',
        );
      } else {
        LoggingMiddleware.prototype.logger.log(
          `${responseLog.method} ${responseLog.path} - ${statusCode} - ${responseTime}ms`,
          'RESPONSE',
        );
      }

      // Log detailed response in debug mode
      LoggingMiddleware.prototype.logger.debug(
        JSON.stringify({
          type: 'response',
          ...responseLog,
          headers: LoggingMiddleware.prototype.sanitizeHeaders(res.getHeaders()),
        }),
      );

      // Call original end method
      return originalEnd.call(this, chunk, encoding);
    };

    res.json = function(body?: any) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      const responseLog: RequestLog = {
        ...requestLog as RequestLog,
        responseTime,
        statusCode,
        responseSize: body ? JSON.stringify(body).length : 0,
      };

      // Log response body in debug mode
      this.logger.debug(
        JSON.stringify({
          type: 'response-body',
          ...responseLog,
          body: this.sanitizeBody(body),
        }),
      );

      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }
    
    return req.connection.remoteAddress || req.ip || 'unknown';
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'auth',
    ];

    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      const result = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
        
        if (isSensitive) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    return sanitizeObject(sanitized);
  }
}
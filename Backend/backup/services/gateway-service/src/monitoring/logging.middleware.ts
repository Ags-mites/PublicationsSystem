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
    const middlewareInstance = this;
    req.headers['x-request-id'] = requestId;
    const requestLog: Partial<RequestLog> = {
      requestId,
      timestamp: new Date(),
      method: req.method,
      path: req.originalUrl || req.url,
      userAgent: req.get('user-agent') || '',
      ip: this.getClientIp(req),
    };
    if (req.user) {
      requestLog.userId = req.user.sub;
      requestLog.userEmail = req.user.email;
    }
    if (req.serviceRoute) {
      requestLog.serviceRoute = req.serviceRoute.serviceId;
    }
    this.logger.log(
      `${requestLog.method} ${requestLog.path} - ${requestLog.ip} - ${requestLog.userAgent}`,
      'REQUEST',
    );
    this.logger.debug(
      JSON.stringify({
        type: 'request',
        ...requestLog,
        headers: this.sanitizeHeaders(req.headers),
        query: req.query,
        body: this.sanitizeBody(req.body),
      }),
    );
    const originalEnd = res.end;
    const originalJson = res.json;
    res.end = function(chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      const responseLog: RequestLog = {
        ...requestLog as RequestLog,
        responseTime,
        statusCode,
        responseSize: chunk ? Buffer.byteLength(chunk) : 0,
      };
      if (statusCode === 429) {
        responseLog.rateLimited = true;
      }
      if (res.get('X-Circuit-Breaker-Triggered')) {
        responseLog.circuitBreakerTriggered = true;
      }
      if (statusCode >= 500) {
        responseLog.error = 'Server error';
        middlewareInstance.logger.error(
          `${responseLog.method} ${responseLog.path} - ${statusCode} - ${responseTime}ms`,
          'RESPONSE',
        );
      } else if (statusCode >= 400) {
        responseLog.error = 'Client error';
        middlewareInstance.logger.warn(
          `${responseLog.method} ${responseLog.path} - ${statusCode} - ${responseTime}ms`,
          'RESPONSE',
        );
      } else {
        middlewareInstance.logger.log(
          `${responseLog.method} ${responseLog.path} - ${statusCode} - ${responseTime}ms`,
          'RESPONSE',
        );
      }
      middlewareInstance.logger.debug(
        JSON.stringify({
          type: 'response',
          ...responseLog,
          headers: middlewareInstance.sanitizeHeaders(res.getHeaders()),
        }),
      );
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
      middlewareInstance.logger.debug(
        JSON.stringify({
          type: 'response-body',
          ...responseLog,
          body: middlewareInstance.sanitizeBody(body),
        }),
      );
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
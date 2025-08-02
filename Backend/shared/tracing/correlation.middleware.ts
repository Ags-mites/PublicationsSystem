import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TracingService } from './tracing.service';

export interface CorrelatedRequest extends Request {
  correlationId: string;
  traceId: string;
  spanId: string;
  userId?: string;
  sessionId?: string;
  startTime: number;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private tracingService: TracingService) {}

  use(req: CorrelatedRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    // Extract or generate correlation ID
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    
    // Extract or generate trace ID
    let traceId = req.headers['x-trace-id'] as string;
    let spanId = req.headers['x-span-id'] as string;
    let parentSpanId = req.headers['x-parent-span-id'] as string;

    if (!traceId) {
      traceId = this.tracingService.generateTraceId();
    }

    if (!spanId) {
      spanId = this.tracingService.generateSpanId();
    }

    // Extract user information if available
    const userId = req.headers['x-user-id'] as string;
    const sessionId = req.headers['x-session-id'] as string;

    // Add to request object
    req.correlationId = correlationId;
    req.traceId = traceId;
    req.spanId = spanId;
    req.userId = userId;
    req.sessionId = sessionId;
    req.startTime = startTime;

    // Add to response headers for client tracking
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Trace-ID', traceId);
    res.setHeader('X-Span-ID', spanId);

    // Create span for this request
    const span = this.tracingService.createSpan(
      traceId,
      `${req.method} ${req.originalUrl || req.url}`,
      parentSpanId
    );

    // Add request metadata to span
    span.setTag('http.method', req.method);
    span.setTag('http.url', req.originalUrl || req.url);
    span.setTag('http.user_agent', req.get('user-agent') || '');
    span.setTag('user.id', userId || '');
    span.setTag('correlation.id', correlationId);

    // Add client IP
    const clientIp = this.getClientIp(req);
    span.setTag('client.ip', clientIp);

    // Store span in request for later use
    (req as any).span = span;

    // Track response completion
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;
      
      // Update span with response information
      span.setTag('http.status_code', res.statusCode);
      span.setTag('response.time_ms', responseTime);
      
      if (res.statusCode >= 400) {
        span.setTag('error', true);
        span.setTag('error.status_code', res.statusCode);
      }

      // Finish the span
      span.finish();

      // Add response time header
      res.setHeader('X-Response-Time', `${responseTime}ms`);

      // Call original end method
      return originalEnd.call(this, chunk, encoding);
    };

    next();
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
}
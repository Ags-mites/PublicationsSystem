import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  tags: Map<string, any>;
  logs: LogEntry[];
  duration?: number;
  setTag(key: string, value: any): void;
  log(message: string, timestamp?: number): void;
  finish(): void;
}

export interface LogEntry {
  timestamp: number;
  message: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
}

class SpanImpl implements Span {
  public tags = new Map<string, any>();
  public logs: LogEntry[] = [];
  public endTime?: number;
  public duration?: number;

  constructor(
    public traceId: string,
    public spanId: string,
    public operationName: string,
    public startTime: number,
    public parentSpanId?: string,
    private onFinish?: (span: Span) => void
  ) {}

  setTag(key: string, value: any): void {
    this.tags.set(key, value);
  }

  log(message: string, timestamp?: number): void {
    this.logs.push({
      timestamp: timestamp || Date.now(),
      message,
    });
  }

  finish(): void {
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
    
    if (this.onFinish) {
      this.onFinish(this);
    }
  }
}

@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);
  private spans = new Map<string, Span>();
  private activeSpans = new Map<string, Span>();

  constructor(private configService: ConfigService) {}

  generateTraceId(): string {
    return this.generateId(32); // 128-bit trace ID
  }

  generateSpanId(): string {
    return this.generateId(16); // 64-bit span ID
  }

  private generateId(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  createSpan(
    traceId: string,
    operationName: string,
    parentSpanId?: string
  ): Span {
    const spanId = this.generateSpanId();
    const span = new SpanImpl(
      traceId,
      spanId,
      operationName,
      Date.now(),
      parentSpanId,
      (finishedSpan) => this.onSpanFinish(finishedSpan)
    );

    this.spans.set(spanId, span);
    this.activeSpans.set(spanId, span);

    this.logger.debug(`Created span: ${operationName} [${spanId}] in trace [${traceId}]`);
    
    return span;
  }

  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  getActiveSpan(spanId: string): Span | undefined {
    return this.activeSpans.get(spanId);
  }

  getAllSpansForTrace(traceId: string): Span[] {
    return Array.from(this.spans.values()).filter(span => span.traceId === traceId);
  }

  private onSpanFinish(span: Span): void {
    this.activeSpans.delete(span.spanId);
    
    this.logger.debug(
      `Finished span: ${span.operationName} [${span.spanId}] duration: ${span.duration}ms`
    );

    // Export to external tracing system if configured
    this.exportSpan(span);

    // Clean up old spans periodically
    this.cleanupOldSpans();
  }

  private exportSpan(span: Span): void {
    const jaegerUrl = this.configService.get<string>('JAEGER_COLLECTOR_URL');
    
    if (jaegerUrl) {
      this.exportToJaeger(span, jaegerUrl);
    }

    // Log span for debugging
    if (this.configService.get<boolean>('TRACE_LOG_SPANS', false)) {
      this.logSpan(span);
    }
  }

  private async exportToJaeger(span: Span, jaegerUrl: string): Promise<void> {
    try {
      const jaegerSpan = this.convertToJaegerFormat(span);
      
      const response = await fetch(`${jaegerUrl}/api/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jaegerSpan),
      });

      if (!response.ok) {
        throw new Error(`Jaeger export failed: ${response.status}`);
      }

      this.logger.debug(`Exported span to Jaeger: ${span.spanId}`);
    } catch (error) {
      this.logger.error(`Failed to export span to Jaeger: ${error.message}`);
    }
  }

  private convertToJaegerFormat(span: Span): any {
    const tags = Array.from(span.tags.entries()).map(([key, value]) => ({
      key,
      type: typeof value === 'string' ? 'string' : 'number',
      value: value.toString(),
    }));

    const logs = span.logs.map(log => ({
      timestamp: log.timestamp * 1000, // Jaeger expects microseconds
      fields: [
        {
          key: 'event',
          value: log.message,
        },
      ],
    }));

    return {
      traceID: span.traceId,
      spanID: span.spanId,
      parentSpanID: span.parentSpanId || '',
      operationName: span.operationName,
      startTime: span.startTime * 1000, // Jaeger expects microseconds
      duration: (span.duration || 0) * 1000, // Jaeger expects microseconds
      tags,
      logs,
      process: {
        serviceName: this.configService.get<string>('SERVICE_NAME', 'unknown'),
        tags: [
          {
            key: 'version',
            value: this.configService.get<string>('SERVICE_VERSION', '1.0.0'),
          },
          {
            key: 'environment',
            value: this.configService.get<string>('NODE_ENV', 'development'),
          },
        ],
      },
    };
  }

  private logSpan(span: Span): void {
    const spanData = {
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      operationName: span.operationName,
      duration: span.duration,
      tags: Object.fromEntries(span.tags),
      logs: span.logs,
    };

    this.logger.debug(`Span completed: ${JSON.stringify(spanData)}`);
  }

  private cleanupOldSpans(): void {
    const maxAge = this.configService.get<number>('TRACE_SPAN_MAX_AGE', 300000); // 5 minutes
    const now = Date.now();

    for (const [spanId, span] of this.spans.entries()) {
      if (span.endTime && (now - span.endTime) > maxAge) {
        this.spans.delete(spanId);
      }
    }
  }

  // Utility methods for instrumentation
  async instrumentAsync<T>(
    operationName: string,
    operation: (span: Span) => Promise<T>,
    parentSpan?: Span
  ): Promise<T> {
    const traceId = parentSpan?.traceId || this.generateTraceId();
    const span = this.createSpan(traceId, operationName, parentSpan?.spanId);

    try {
      const result = await operation(span);
      span.setTag('success', true);
      return result;
    } catch (error) {
      span.setTag('error', true);
      span.setTag('error.message', error.message);
      span.log(`Error: ${error.message}`);
      throw error;
    } finally {
      span.finish();
    }
  }

  instrumentSync<T>(
    operationName: string,
    operation: (span: Span) => T,
    parentSpan?: Span
  ): T {
    const traceId = parentSpan?.traceId || this.generateTraceId();
    const span = this.createSpan(traceId, operationName, parentSpan?.spanId);

    try {
      const result = operation(span);
      span.setTag('success', true);
      return result;
    } catch (error) {
      span.setTag('error', true);
      span.setTag('error.message', error.message);
      span.log(`Error: ${error.message}`);
      throw error;
    } finally {
      span.finish();
    }
  }

  // Metrics collection
  getTracingMetrics(): any {
    const activeSpansCount = this.activeSpans.size;
    const totalSpansCount = this.spans.size;
    
    return {
      activeSpans: activeSpansCount,
      totalSpans: totalSpansCount,
      memoryUsage: {
        spans: totalSpansCount,
        estimatedBytes: totalSpansCount * 1024, // Rough estimate
      },
    };
  }

  // Administrative methods
  clearAllSpans(): void {
    this.spans.clear();
    this.activeSpans.clear();
    this.logger.log('Cleared all spans');
  }

  getTraceTree(traceId: string): any {
    const spans = this.getAllSpansForTrace(traceId);
    const spanMap = new Map(spans.map(span => [span.spanId, span]));
    
    // Build tree structure
    const tree = {
      traceId,
      spans: spans.map(span => ({
        spanId: span.spanId,
        parentSpanId: span.parentSpanId,
        operationName: span.operationName,
        duration: span.duration,
        tags: Object.fromEntries(span.tags),
        children: spans
          .filter(child => child.parentSpanId === span.spanId)
          .map(child => child.spanId),
      })),
    };

    return tree;
  }
}
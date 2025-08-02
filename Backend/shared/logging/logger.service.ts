import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { LogEntry, LogContext, LoggerConfig, PerformanceLog, LogError } from './logging.interfaces';

@Injectable()
export class StructuredLoggerService {
  private readonly logger: winston.Logger;
  private readonly serviceName: string;
  private readonly environment: string;
  private readonly version: string;
  private readonly nestLogger = new Logger(StructuredLoggerService.name);

  constructor(private configService: ConfigService) {
    this.serviceName = this.configService.get<string>('SERVICE_NAME', 'unknown-service');
    this.environment = this.configService.get<string>('NODE_ENV', 'development');
    this.version = this.configService.get<string>('SERVICE_VERSION', '1.0.0');

    const config = this.getLoggerConfig();
    this.logger = this.createWinstonLogger(config);
  }

  private getLoggerConfig(): LoggerConfig {
    return {
      level: this.configService.get<string>('LOG_LEVEL', 'info'),
      service: this.serviceName,
      environment: this.environment,
      version: this.version,
      enableConsole: this.configService.get<boolean>('LOG_CONSOLE', true),
      enableFile: this.configService.get<boolean>('LOG_FILE', true),
      enableLoki: this.configService.get<boolean>('LOG_LOKI', false),
      filePath: this.configService.get<string>('LOG_FILE_PATH', `logs/${this.serviceName}.log`),
      lokiUrl: this.configService.get<string>('LOKI_URL', 'http://localhost:3100'),
      maxFileSize: this.configService.get<string>('LOG_MAX_FILE_SIZE', '20m'),
      maxFiles: this.configService.get<number>('LOG_MAX_FILES', 5),
      lokiLabels: {
        service: this.serviceName,
        environment: this.environment,
        version: this.version,
      },
    };
  }

  private createWinstonLogger(config: LoggerConfig): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport
    if (config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const context = meta.context ? ` [${meta.context}]` : '';
              const traceInfo = meta.traceId ? ` [${meta.traceId}]` : '';
              return `${timestamp} ${level}${context}${traceInfo}: ${message}`;
            })
          ),
        })
      );
    }

    // File transport
    if (config.enableFile && config.filePath) {
      transports.push(
        new winston.transports.File({
          filename: config.filePath,
          maxsize: this.parseSize(config.maxFileSize || '20m'),
          maxFiles: config.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          ),
        })
      );
    }

    // Loki transport (if available)
    if (config.enableLoki && config.lokiUrl) {
      try {
        const LokiTransport = require('winston-loki');
        transports.push(
          new LokiTransport({
            host: config.lokiUrl,
            labels: config.lokiLabels,
            json: true,
            format: winston.format.json(),
            replaceTimestamp: true,
            onConnectionError: (err: Error) => {
              this.nestLogger.error(`Loki connection error: ${err.message}`);
            },
          })
        );
      } catch (error) {
        this.nestLogger.warn('winston-loki not available, skipping Loki transport');
      }
    }

    return winston.createLogger({
      level: config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: config.service,
        environment: config.environment,
        version: config.version,
      },
      transports,
    });
  }

  private parseSize(size: string): number {
    const units = { k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
    const match = size.toLowerCase().match(/^(\d+)([kmg]?)$/);
    if (!match) return 20 * 1024 * 1024; // Default 20MB
    
    const [, value, unit] = match;
    return parseInt(value) * (units[unit as keyof typeof units] || 1);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const logContext = { ...context };
    
    if (error) {
      logContext.error = this.serializeError(error);
    }
    
    this.log('error', message, logContext);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: LogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...context,
    };

    // Add trace information if available
    if (context?.traceId) {
      logEntry.traceId = context.traceId;
    }
    
    if (context?.spanId) {
      logEntry.spanId = context.spanId;
    }
    
    if (context?.correlationId) {
      logEntry.correlationId = context.correlationId;
    }

    this.logger.log(level, message, logEntry);
  }

  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext
  ): void {
    const message = `${method} ${url} ${statusCode} - ${responseTime}ms`;
    const logContext: LogContext = {
      ...context,
      metadata: {
        httpMethod: method,
        httpUrl: url,
        httpStatusCode: statusCode,
        responseTime,
        ...context?.metadata,
      },
    };

    if (statusCode >= 500) {
      this.error(message, undefined, logContext);
    } else if (statusCode >= 400) {
      this.warn(message, logContext);
    } else {
      this.info(message, logContext);
    }
  }

  logPerformance(performanceLog: PerformanceLog): void {
    const message = `Operation ${performanceLog.operation} completed in ${performanceLog.duration}ms`;
    const context: LogContext = {
      operation: performanceLog.operation,
      traceId: performanceLog.traceId,
      metadata: {
        ...performanceLog.metadata,
        responseTime: performanceLog.duration,
        success: performanceLog.success,
      },
    };

    if (performanceLog.success) {
      this.info(message, context);
    } else {
      this.warn(message, context);
    }
  }

  logBusinessEvent(
    event: string,
    data: Record<string, any>,
    context?: LogContext
  ): void {
    const message = `Business event: ${event}`;
    const logContext: LogContext = {
      ...context,
      component: 'business',
      metadata: {
        ...context?.metadata,
        event,
        eventData: data,
      },
    };

    this.info(message, logContext);
  }

  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    context?: LogContext
  ): void {
    const message = `Security event: ${event} (${severity})`;
    const logContext: LogContext = {
      ...context,
      component: 'security',
      metadata: {
        ...context?.metadata,
        securityEvent: event,
        severity,
        details,
      },
    };

    if (severity === 'critical' || severity === 'high') {
      this.error(message, undefined, logContext);
    } else if (severity === 'medium') {
      this.warn(message, logContext);
    } else {
      this.info(message, logContext);
    }
  }

  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    rowsAffected?: number,
    context?: LogContext
  ): void {
    const message = `Database ${operation} on ${table} - ${duration}ms`;
    const logContext: LogContext = {
      ...context,
      component: 'database',
      operation,
      metadata: {
        ...context?.metadata,
        databaseOperation: operation,
        table,
        responseTime: duration,
        rowsAffected,
      },
    };

    if (duration > 1000) { // Slow query threshold
      this.warn(message, logContext);
    } else {
      this.debug(message, logContext);
    }
  }

  logExternalServiceCall(
    serviceName: string,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const message = `External service call: ${serviceName} ${method} ${endpoint} ${statusCode} - ${duration}ms`;
    const logContext: LogContext = {
      ...context,
      component: 'external-service',
      metadata: {
        ...context?.metadata,
        externalService: serviceName,
        endpoint,
        httpMethod: method,
        httpStatusCode: statusCode,
        responseTime: duration,
      },
    };

    if (statusCode >= 500) {
      this.error(message, undefined, logContext);
    } else if (statusCode >= 400) {
      this.warn(message, logContext);
    } else {
      this.info(message, logContext);
    }
  }

  private serializeError(error: Error): LogError {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack || '',
      code: (error as any).code,
      statusCode: (error as any).statusCode,
    };
  }

  // Utility method to create child logger with context
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }

  // Method to flush logs (useful for testing or graceful shutdown)
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.on('finish', () => resolve());
      this.logger.end();
    });
  }
}

class ChildLogger {
  constructor(
    private parent: StructuredLoggerService,
    private context: LogContext
  ) {}

  info(message: string, additionalContext?: LogContext): void {
    this.parent.info(message, { ...this.context, ...additionalContext });
  }

  warn(message: string, additionalContext?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...additionalContext });
  }

  error(message: string, error?: Error, additionalContext?: LogContext): void {
    this.parent.error(message, error, { ...this.context, ...additionalContext });
  }

  debug(message: string, additionalContext?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...additionalContext });
  }
}
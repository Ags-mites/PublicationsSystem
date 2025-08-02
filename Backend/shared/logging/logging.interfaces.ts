export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  service: string;
  traceId?: string;
  spanId?: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  message: string;
  context?: any;
  error?: LogError;
  metadata?: LogMetadata;
}

export interface LogError {
  name: string;
  message: string;
  stack: string;
  code?: string;
  statusCode?: number;
}

export interface LogMetadata {
  httpMethod?: string;
  httpUrl?: string;
  httpStatusCode?: number;
  httpUserAgent?: string;
  responseTime?: number;
  ip?: string;
  requestId?: string;
  operation?: string;
  component?: string;
  version?: string;
  environment?: string;
}

export interface LogContext {
  traceId?: string;
  spanId?: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  operation?: string;
  component?: string;
  [key: string]: any;
}

export interface LoggerConfig {
  level: string;
  service: string;
  environment: string;
  version: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableLoki: boolean;
  filePath?: string;
  lokiUrl?: string;
  maxFileSize?: string;
  maxFiles?: number;
  lokiLabels?: Record<string, string>;
}

export interface PerformanceLog {
  operation: string;
  duration: number;
  success: boolean;
  traceId?: string;
  metadata?: Record<string, any>;
}
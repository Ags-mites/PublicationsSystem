export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  service: string;
  dependencies: {
    database: DependencyHealth;
    rabbitmq?: DependencyHealth;
    consul: DependencyHealth;
    external?: Record<string, DependencyHealth>;
  };
  metrics: ServiceMetrics;
  checks: HealthCheck[];
}

export interface DependencyHealth {
  status: 'connected' | 'disconnected' | 'degraded';
  responseTime?: number;
  lastChecked: Date;
  error?: string;
  details?: any;
}

export interface ServiceMetrics {
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  activeConnections: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  time: string;
  output?: string;
  details?: any;
}

export interface LivenessResponse {
  status: 'alive' | 'dead';
  timestamp: Date;
}

export interface ReadinessResponse {
  status: 'ready' | 'not_ready';
  timestamp: Date;
  dependencies: string[];
  failedDependencies: string[];
}

export interface MetricsResponse {
  service: string;
  timestamp: Date;
  metrics: Record<string, number | string>;
  custom?: Record<string, any>;
}
export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  fallbackResponse: {
    statusCode: number;
    message: string;
    data?: any;
  };
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastChecked: Date;
  details?: any;
  circuitState?: CircuitBreakerState;
}
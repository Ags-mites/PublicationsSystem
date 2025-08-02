import { Injectable, Logger } from '@nestjs/common';

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface GatewayMetrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    byStatus: Record<string, number>;
    byService: Record<string, number>;
    byPath: Record<string, number>;
  };
  responseTime: {
    average: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };
  circuitBreakers: {
    total: number;
    open: number;
    halfOpen: number;
    closed: number;
  };
  rateLimit: {
    totalRequests: number;
    blockedRequests: number;
    blockRate: number;
  };
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

interface ResponseTimeData {
  value: number;
  timestamp: Date;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly MAX_RESPONSE_TIME_SAMPLES = 1000;
  
  // Counters
  private requestCount = 0;
  private successCount = 0;
  private errorCount = 0;
  private rateLimitedCount = 0;
  
  // Detailed counters
  private statusCodeCounts = new Map<number, number>();
  private serviceCounts = new Map<string, number>();
  private pathCounts = new Map<string, number>();
  
  // Response time tracking
  private responseTimes: ResponseTimeData[] = [];
  
  // Circuit breaker metrics
  private circuitBreakerStates = new Map<string, string>();
  
  // Start time for uptime calculation
  private startTime = Date.now();
  private lastCpuUsage = process.cpuUsage();

  recordRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    serviceId?: string,
    rateLimited?: boolean,
  ): void {
    this.requestCount++;
    
    // Track success/error
    if (statusCode >= 200 && statusCode < 400) {
      this.successCount++;
    } else {
      this.errorCount++;
    }
    
    // Track rate limiting
    if (rateLimited) {
      this.rateLimitedCount++;
    }
    
    // Track by status code
    const currentStatusCount = this.statusCodeCounts.get(statusCode) || 0;
    this.statusCodeCounts.set(statusCode, currentStatusCount + 1);
    
    // Track by service
    if (serviceId) {
      const currentServiceCount = this.serviceCounts.get(serviceId) || 0;
      this.serviceCounts.set(serviceId, currentServiceCount + 1);
    }
    
    // Track by path (normalize to avoid too many unique paths)
    const normalizedPath = this.normalizePath(path);
    const currentPathCount = this.pathCounts.get(normalizedPath) || 0;
    this.pathCounts.set(normalizedPath, currentPathCount + 1);
    
    // Track response time
    this.responseTimes.push({
      value: responseTime,
      timestamp: new Date(),
    });
    
    // Keep only recent response times
    if (this.responseTimes.length > this.MAX_RESPONSE_TIME_SAMPLES) {
      this.responseTimes = this.responseTimes.slice(-this.MAX_RESPONSE_TIME_SAMPLES);
    }
    
    this.logger.debug(
      `Metrics recorded: ${method} ${path} - ${statusCode} - ${responseTime}ms - service: ${serviceId}`,
    );
  }

  recordCircuitBreakerState(serviceId: string, state: string): void {
    this.circuitBreakerStates.set(serviceId, state);
  }

  getMetrics(): GatewayMetrics {
    const responseTimeStats = this.calculateResponseTimeStats();
    const circuitBreakerStats = this.calculateCircuitBreakerStats();
    
    return {
      requests: {
        total: this.requestCount,
        success: this.successCount,
        errors: this.errorCount,
        byStatus: Object.fromEntries(this.statusCodeCounts),
        byService: Object.fromEntries(this.serviceCounts),
        byPath: Object.fromEntries(this.pathCounts),
      },
      responseTime: responseTimeStats,
      circuitBreakers: circuitBreakerStats,
      rateLimit: {
        totalRequests: this.requestCount,
        blockedRequests: this.rateLimitedCount,
        blockRate: this.requestCount > 0 ? this.rateLimitedCount / this.requestCount : 0,
      },
      system: {
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(this.lastCpuUsage),
      },
    };
  }

  getPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [];

    // Request metrics
    lines.push('# HELP gateway_requests_total Total number of requests');
    lines.push('# TYPE gateway_requests_total counter');
    lines.push(`gateway_requests_total ${metrics.requests.total}`);

    lines.push('# HELP gateway_requests_success_total Total number of successful requests');
    lines.push('# TYPE gateway_requests_success_total counter');
    lines.push(`gateway_requests_success_total ${metrics.requests.success}`);

    lines.push('# HELP gateway_requests_errors_total Total number of error requests');
    lines.push('# TYPE gateway_requests_errors_total counter');
    lines.push(`gateway_requests_errors_total ${metrics.requests.errors}`);

    // Response time metrics
    lines.push('# HELP gateway_response_time_seconds Response time statistics');
    lines.push('# TYPE gateway_response_time_seconds summary');
    lines.push(`gateway_response_time_seconds{quantile="0.95"} ${metrics.responseTime.p95 / 1000}`);
    lines.push(`gateway_response_time_seconds{quantile="0.99"} ${metrics.responseTime.p99 / 1000}`);
    lines.push(`gateway_response_time_seconds_sum ${(metrics.responseTime.average * metrics.requests.total) / 1000}`);
    lines.push(`gateway_response_time_seconds_count ${metrics.requests.total}`);

    // Circuit breaker metrics
    lines.push('# HELP gateway_circuit_breakers_total Total number of circuit breakers');
    lines.push('# TYPE gateway_circuit_breakers_total gauge');
    lines.push(`gateway_circuit_breakers_total ${metrics.circuitBreakers.total}`);

    lines.push('# HELP gateway_circuit_breakers_open Number of open circuit breakers');
    lines.push('# TYPE gateway_circuit_breakers_open gauge');
    lines.push(`gateway_circuit_breakers_open ${metrics.circuitBreakers.open}`);

    // Rate limit metrics
    lines.push('# HELP gateway_rate_limited_requests_total Total number of rate limited requests');
    lines.push('# TYPE gateway_rate_limited_requests_total counter');
    lines.push(`gateway_rate_limited_requests_total ${metrics.rateLimit.blockedRequests}`);

    // System metrics
    lines.push('# HELP gateway_uptime_seconds Gateway uptime in seconds');
    lines.push('# TYPE gateway_uptime_seconds counter');
    lines.push(`gateway_uptime_seconds ${metrics.system.uptime}`);

    lines.push('# HELP gateway_memory_usage_bytes Memory usage in bytes');
    lines.push('# TYPE gateway_memory_usage_bytes gauge');
    lines.push(`gateway_memory_usage_bytes{type="rss"} ${metrics.system.memoryUsage.rss}`);
    lines.push(`gateway_memory_usage_bytes{type="heapTotal"} ${metrics.system.memoryUsage.heapTotal}`);
    lines.push(`gateway_memory_usage_bytes{type="heapUsed"} ${metrics.system.memoryUsage.heapUsed}`);

    // Service-specific metrics
    Object.entries(metrics.requests.byService).forEach(([service, count]) => {
      lines.push(`gateway_requests_by_service{service="${service}"} ${count}`);
    });

    // Status code metrics
    Object.entries(metrics.requests.byStatus).forEach(([status, count]) => {
      lines.push(`gateway_requests_by_status{status="${status}"} ${count}`);
    });

    return lines.join('\n') + '\n';
  }

  private calculateResponseTimeStats(): GatewayMetrics['responseTime'] {
    if (this.responseTimes.length === 0) {
      return {
        average: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
      };
    }

    const times = this.responseTimes.map(rt => rt.value).sort((a, b) => a - b);
    const sum = times.reduce((acc, time) => acc + time, 0);
    
    return {
      average: sum / times.length,
      p95: this.getPercentile(times, 0.95),
      p99: this.getPercentile(times, 0.99),
      min: times[0],
      max: times[times.length - 1],
    };
  }

  private calculateCircuitBreakerStats(): GatewayMetrics['circuitBreakers'] {
    const states = Array.from(this.circuitBreakerStates.values());
    
    return {
      total: states.length,
      open: states.filter(state => state === 'OPEN').length,
      halfOpen: states.filter(state => state === 'HALF_OPEN').length,
      closed: states.filter(state => state === 'CLOSED').length,
    };
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  private normalizePath(path: string): string {
    // Remove query parameters
    const pathWithoutQuery = path.split('?')[0];
    
    // Replace IDs with placeholder
    return pathWithoutQuery.replace(/\/\d+/g, '/:id');
  }

  // Administrative methods
  resetMetrics(): void {
    this.requestCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.rateLimitedCount = 0;
    this.statusCodeCounts.clear();
    this.serviceCounts.clear();
    this.pathCounts.clear();
    this.responseTimes = [];
    this.circuitBreakerStates.clear();
    this.startTime = Date.now();
    this.lastCpuUsage = process.cpuUsage();
    
    this.logger.log('Metrics reset');
  }

  getMetricsSummary(): any {
    const metrics = this.getMetrics();
    
    return {
      totalRequests: metrics.requests.total,
      successRate: metrics.requests.total > 0 ? metrics.requests.success / metrics.requests.total : 0,
      errorRate: metrics.requests.total > 0 ? metrics.requests.errors / metrics.requests.total : 0,
      averageResponseTime: metrics.responseTime.average,
      uptime: metrics.system.uptime,
      activeCircuitBreakers: metrics.circuitBreakers.total,
      openCircuitBreakers: metrics.circuitBreakers.open,
    };
  }
}
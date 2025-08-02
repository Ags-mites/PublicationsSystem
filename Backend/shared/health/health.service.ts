import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckResponse,
  DependencyHealth,
  ServiceMetrics,
  HealthCheck,
  LivenessResponse,
  ReadinessResponse,
  MetricsResponse,
} from './health.interfaces';

@Injectable()
export class BaseHealthService {
  private readonly logger = new Logger(BaseHealthService.name);
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];

  constructor(private configService: ConfigService) {}

  async getHealth(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Performing comprehensive health check');

      // Run all health checks in parallel
      const [dependencies, metrics, checks] = await Promise.all([
        this.checkDependencies(),
        this.getServiceMetrics(),
        this.runHealthChecks(),
      ]);

      // Determine overall status
      const status = this.determineOverallStatus(dependencies, checks);

      const response: HealthCheckResponse = {
        status,
        timestamp: new Date(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        version: this.configService.get<string>('SERVICE_VERSION', '1.0.0'),
        service: this.configService.get<string>('SERVICE_NAME', 'unknown'),
        dependencies,
        metrics,
        checks,
      };

      this.logger.debug(`Health check completed in ${Date.now() - startTime}ms: ${status}`);
      return response;

    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        version: this.configService.get<string>('SERVICE_VERSION', '1.0.0'),
        service: this.configService.get<string>('SERVICE_NAME', 'unknown'),
        dependencies: {
          database: { status: 'disconnected', lastChecked: new Date(), error: 'Health check failed' },
          consul: { status: 'disconnected', lastChecked: new Date(), error: 'Health check failed' },
        },
        metrics: await this.getServiceMetrics(),
        checks: [
          {
            name: 'health-check',
            status: 'fail',
            time: new Date().toISOString(),
            output: error.message,
          },
        ],
      };
    }
  }

  async getLiveness(): Promise<LivenessResponse> {
    // Simple liveness check - just verify the process is running
    return {
      status: 'alive',
      timestamp: new Date(),
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    try {
      const dependencies = await this.checkDependencies();
      const dependencyNames = Object.keys(dependencies);
      const failedDependencies = dependencyNames.filter(
        name => dependencies[name].status === 'disconnected'
      );

      return {
        status: failedDependencies.length === 0 ? 'ready' : 'not_ready',
        timestamp: new Date(),
        dependencies: dependencyNames,
        failedDependencies,
      };
    } catch (error) {
      this.logger.error(`Readiness check failed: ${error.message}`);
      return {
        status: 'not_ready',
        timestamp: new Date(),
        dependencies: [],
        failedDependencies: ['health-check-service'],
      };
    }
  }

  async getMetrics(): Promise<MetricsResponse> {
    const metrics = await this.getServiceMetrics();
    
    // Convert to Prometheus format if needed
    const prometheusMetrics: Record<string, number | string> = {
      'service_uptime_seconds': Math.floor((Date.now() - this.startTime) / 1000),
      'service_memory_usage_bytes': metrics.memoryUsage.rss,
      'service_heap_usage_bytes': metrics.memoryUsage.heapUsed,
      'service_active_connections': metrics.activeConnections,
      'service_requests_total': metrics.requestCount,
      'service_errors_total': metrics.errorCount,
      'service_response_time_avg_ms': metrics.averageResponseTime,
    };

    return {
      service: this.configService.get<string>('SERVICE_NAME', 'unknown'),
      timestamp: new Date(),
      metrics: prometheusMetrics,
      custom: await this.getCustomMetrics(),
    };
  }

  private async checkDependencies(): Promise<HealthCheckResponse['dependencies']> {
    const dependencies: HealthCheckResponse['dependencies'] = {
      database: await this.checkDatabase(),
      consul: await this.checkConsul(),
    };

    // Add RabbitMQ check if configured
    const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
    if (rabbitmqUrl) {
      dependencies.rabbitmq = await this.checkRabbitMQ();
    }

    // Add external service checks
    const externalServices = this.getExternalServices();
    if (externalServices.length > 0) {
      dependencies.external = {};
      for (const service of externalServices) {
        dependencies.external[service.name] = await this.checkExternalService(service.url);
      }
    }

    return dependencies;
  }

  private async checkDatabase(): Promise<DependencyHealth> {
    const startTime = Date.now();
    
    try {
      // Override this method in service-specific implementations
      await this.performDatabaseCheck();
      
      return {
        status: 'connected',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return {
        status: 'disconnected',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error.message,
      };
    }
  }

  private async checkConsul(): Promise<DependencyHealth> {
    const startTime = Date.now();
    
    try {
      // Check if Consul is reachable
      const consulHost = this.configService.get<string>('CONSUL_HOST', 'localhost');
      const consulPort = this.configService.get<number>('CONSUL_PORT', 8500);
      
      const response = await fetch(`http://${consulHost}:${consulPort}/v1/status/leader`, {
        method: 'GET',
        timeout: 5000,
      });

      if (response.ok) {
        return {
          status: 'connected',
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
        };
      } else {
        throw new Error(`Consul returned ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`Consul health check failed: ${error.message}`);
      return {
        status: 'disconnected',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error.message,
      };
    }
  }

  private async checkRabbitMQ(): Promise<DependencyHealth> {
    const startTime = Date.now();
    
    try {
      // Override this method in service-specific implementations
      await this.performRabbitMQCheck();
      
      return {
        status: 'connected',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error(`RabbitMQ health check failed: ${error.message}`);
      return {
        status: 'disconnected',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error.message,
      };
    }
  }

  private async checkExternalService(url: string): Promise<DependencyHealth> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 10000,
      });

      return {
        status: response.ok ? 'connected' : 'degraded',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: { statusCode: response.status },
      };
    } catch (error) {
      return {
        status: 'disconnected',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error.message,
      };
    }
  }

  private async getServiceMetrics(): Promise<ServiceMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memoryUsage,
      cpuUsage,
      activeConnections: this.getActiveConnections(),
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      averageResponseTime: this.calculateAverageResponseTime(),
    };
  }

  private async runHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 1024 * 1024 * 1024; // 1GB
    checks.push({
      name: 'memory-usage',
      status: memoryUsage.rss < memoryThreshold ? 'pass' : 'warn',
      time: new Date().toISOString(),
      output: `RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    });

    // Uptime check
    const uptime = process.uptime();
    checks.push({
      name: 'uptime',
      status: uptime > 60 ? 'pass' : 'warn', // At least 1 minute
      time: new Date().toISOString(),
      output: `${Math.round(uptime)}s`,
    });

    // Error rate check
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
    checks.push({
      name: 'error-rate',
      status: errorRate < 0.1 ? 'pass' : 'warn', // Less than 10%
      time: new Date().toISOString(),
      output: `${Math.round(errorRate * 100)}%`,
    });

    // Add custom health checks
    const customChecks = await this.getCustomHealthChecks();
    checks.push(...customChecks);

    return checks;
  }

  private determineOverallStatus(
    dependencies: HealthCheckResponse['dependencies'],
    checks: HealthCheck[]
  ): 'healthy' | 'unhealthy' | 'degraded' {
    // Check for critical dependency failures
    const criticalDependencies = ['database', 'consul'];
    const failedCritical = criticalDependencies.some(
      dep => dependencies[dep]?.status === 'disconnected'
    );

    if (failedCritical) {
      return 'unhealthy';
    }

    // Check for failed health checks
    const failedChecks = checks.filter(check => check.status === 'fail');
    if (failedChecks.length > 0) {
      return 'unhealthy';
    }

    // Check for warnings
    const warnChecks = checks.filter(check => check.status === 'warn');
    const degradedDependencies = Object.values(dependencies).some(
      dep => dep.status === 'degraded'
    );

    if (warnChecks.length > 0 || degradedDependencies) {
      return 'degraded';
    }

    return 'healthy';
  }

  // Methods to be overridden by service-specific implementations
  protected async performDatabaseCheck(): Promise<void> {
    // Override in service-specific health service
    throw new Error('Database check not implemented');
  }

  protected async performRabbitMQCheck(): Promise<void> {
    // Override in service-specific health service
    throw new Error('RabbitMQ check not implemented');
  }

  protected getActiveConnections(): number {
    // Override in service-specific health service
    return 0;
  }

  protected getExternalServices(): Array<{ name: string; url: string }> {
    // Override in service-specific health service
    return [];
  }

  protected async getCustomHealthChecks(): Promise<HealthCheck[]> {
    // Override in service-specific health service
    return [];
  }

  protected async getCustomMetrics(): Promise<Record<string, any>> {
    // Override in service-specific health service
    return {};
  }

  // Utility methods for tracking metrics
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    this.responseTimes.push(responseTime);
    
    if (isError) {
      this.errorCount++;
    }

    // Keep only recent response times (last 1000)
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  private calculateAverageResponseTime(): number {
    if (this.responseTimes.length === 0) {
      return 0;
    }
    
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimes.length);
  }
}
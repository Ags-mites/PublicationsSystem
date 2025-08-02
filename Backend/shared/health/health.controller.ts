import { Controller, Get, Logger, Header } from '@nestjs/common';
import { BaseHealthService } from './health.service';
import {
  HealthCheckResponse,
  LivenessResponse,
  ReadinessResponse,
  MetricsResponse,
} from './health.interfaces';

@Controller('health')
export class BaseHealthController {
  private readonly logger = new Logger(BaseHealthController.name);

  constructor(private healthService: BaseHealthService) {}

  @Get()
  async getHealth(): Promise<HealthCheckResponse> {
    this.logger.debug('Health check endpoint called');
    return this.healthService.getHealth();
  }

  @Get('live')
  async getLiveness(): Promise<LivenessResponse> {
    this.logger.debug('Liveness probe called');
    return this.healthService.getLiveness();
  }

  @Get('ready')
  async getReadiness(): Promise<ReadinessResponse> {
    this.logger.debug('Readiness probe called');
    return this.healthService.getReadiness();
  }

  @Get('metrics')
  @Header('Content-Type', 'application/json')
  async getMetrics(): Promise<MetricsResponse> {
    this.logger.debug('Metrics endpoint called');
    return this.healthService.getMetrics();
  }

  @Get('metrics/prometheus')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getPrometheusMetrics(): Promise<string> {
    this.logger.debug('Prometheus metrics endpoint called');
    const metrics = await this.healthService.getMetrics();
    
    return this.formatPrometheusMetrics(metrics);
  }

  private formatPrometheusMetrics(metrics: MetricsResponse): string {
    const lines: string[] = [];
    
    // Add service info
    lines.push(`# HELP service_info Service information`);
    lines.push(`# TYPE service_info gauge`);
    lines.push(`service_info{service="${metrics.service}",version="1.0.0"} 1`);
    lines.push('');

    // Convert metrics to Prometheus format
    Object.entries(metrics.metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        lines.push(`# HELP ${key} ${key.replace(/_/g, ' ')}`);
        lines.push(`# TYPE ${key} gauge`);
        lines.push(`${key}{service="${metrics.service}"} ${value}`);
        lines.push('');
      }
    });

    // Add custom metrics if available
    if (metrics.custom) {
      Object.entries(metrics.custom).forEach(([key, value]) => {
        if (typeof value === 'number') {
          lines.push(`# HELP ${key} Custom metric: ${key}`);
          lines.push(`# TYPE ${key} gauge`);
          lines.push(`${key}{service="${metrics.service}"} ${value}`);
          lines.push('');
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested metrics
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (typeof subValue === 'number') {
              const metricName = `${key}_${subKey}`;
              lines.push(`# HELP ${metricName} Custom metric: ${metricName}`);
              lines.push(`# TYPE ${metricName} gauge`);
              lines.push(`${metricName}{service="${metrics.service}"} ${subValue}`);
              lines.push('');
            }
          });
        }
      });
    }

    return lines.join('\n');
  }
}
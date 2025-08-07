import { Controller, Get, Post, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';
@Controller('monitoring')
export class MonitoringController {
  private readonly logger = new Logger(MonitoringController.name);
  constructor(private metricsService: MetricsService) {}
  @Get('metrics')
  async getMetrics() {
    this.logger.debug('Metrics requested');
    return this.metricsService.getMetrics();
  }
  @Get('metrics/prometheus')
  async getPrometheusMetrics(@Res() res: Response) {
    this.logger.debug('Prometheus metrics requested');
    const metrics = this.metricsService.getPrometheusMetrics();
    res.set({
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    });
    res.send(metrics);
  }
  @Get('metrics/summary')
  async getMetricsSummary() {
    this.logger.debug('Metrics summary requested');
    return this.metricsService.getMetricsSummary();
  }
  @Post('metrics/reset')
  async resetMetrics() {
    this.logger.log('Metrics reset requested');
    this.metricsService.resetMetrics();
    return { message: 'Metrics reset successfully' };
  }
}
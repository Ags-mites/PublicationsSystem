import { Controller, Get, Param, Logger } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private healthService: HealthService) {}

  @Get()
  async getHealth() {
    this.logger.debug('Health check requested');
    return this.healthService.getSimpleHealthCheck();
  }

  @Get('detailed')
  async getDetailedHealth() {
    this.logger.debug('Detailed health check requested');
    return this.healthService.getHealthCheck();
  }

  @Get('service/:serviceId')
  async getServiceHealth(@Param('serviceId') serviceId: string) {
    this.logger.debug(`Service health check requested for: ${serviceId}`);
    return this.healthService.checkServiceHealth(serviceId);
  }

  @Get('metrics')
  async getMetrics() {
    this.logger.debug('Metrics requested');
    return this.healthService.getMetrics();
  }
}
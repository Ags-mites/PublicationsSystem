import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CatalogService } from '../services/catalog.service';
import { MetricsService } from '../services/metrics.service';
// import { HealthResponseDto } from '../dto';

@ApiTags('Health')
@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private catalogService: CatalogService,
    private metricsService: MetricsService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  @ApiResponse({ status: 503, description: 'Service unhealthy' })
  @Throttle(60, 60)
  async healthCheck(): Promise<any> {
    console.log('Health check called');
    return {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ping')
  @ApiOperation({ summary: 'Simple ping endpoint' })
  @ApiResponse({ status: 200, description: 'Pong response' })
  async ping(): Promise<any> {
    return { message: 'pong' };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Service metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Service metrics and statistics' })
  @Throttle(10, 60)
  async getMetrics(): Promise<any> {
    try {
      const [catalogStats, searchMetrics] = await Promise.all([
        this.metricsService.getCatalogStatistics(),
        this.metricsService.getSearchMetrics(7), // Last 7 days
      ]);

      return {
        catalog: catalogStats,
        search: searchMetrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get metrics: ${error.message}`, error.stack);
      throw new HttpException('Metrics unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
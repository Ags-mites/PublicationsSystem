import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  @Get()
  @ApiOperation({ summary: 'Get service metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  getMetrics() {
    return {
      service: 'publications-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
} 
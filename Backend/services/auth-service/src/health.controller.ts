import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  getHealth(): object {
    return { 
      status: 'healthy', 
      service: 'auth-service', 
      timestamp: new Date(),
      version: '1.0.0'
    };
  }
}
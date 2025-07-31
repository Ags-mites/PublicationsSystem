import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GatewayService } from './gateway.service';

@ApiTags('Gateway')
@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get()
  @ApiOperation({ summary: 'Gateway status and service discovery' })
  @ApiResponse({ status: 200, description: 'Gateway information and available services' })
  async getGatewayInfo(): Promise<object> {
    return this.gatewayService.getGatewayInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Gateway health status' })
  getHealth(): object {
    return this.gatewayService.getHealth();
  }

  @Get('services')
  @ApiOperation({ summary: 'List all discovered services' })
  @ApiResponse({ status: 200, description: 'List of available services' })
  async getServices(): Promise<object> {
    return this.gatewayService.getDiscoveredServices();
  }
}
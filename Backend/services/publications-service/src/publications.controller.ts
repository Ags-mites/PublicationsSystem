import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicationsService } from './publications.service';

@ApiTags('Publications')
@Controller('publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @Get('hello')
  @ApiOperation({ summary: 'Service status endpoint' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  getHello(): object {
    return this.publicationsService.getHello();
  }

  @Get('list')
  @ApiOperation({ summary: 'Get all publications' })
  @ApiResponse({ status: 200, description: 'List of publications' })
  getPublications(): object {
    return this.publicationsService.getPublications();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for Consul' })
  getHealth(): object {
    return { status: 'healthy', service: 'publications-service', timestamp: new Date() };
  }
}
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('hello')
  @ApiOperation({ summary: 'Service status endpoint' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  getHello(): object {
    return this.catalogService.getHello();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search publications in catalog' })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Search results' })
  searchCatalog(@Query('query') query?: string): object {
    return this.catalogService.searchCatalog(query);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for Consul' })
  getHealth(): object {
    return { status: 'healthy', service: 'catalog-service', timestamp: new Date() };
  }
}
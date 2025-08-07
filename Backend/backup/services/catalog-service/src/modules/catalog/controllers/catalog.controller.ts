import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CacheTTL } from '@nestjs/cache-manager';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CatalogSearchService } from '../services/catalog-search.service';
import { CatalogService } from '../services/catalog.service';
import { MetricsService } from '../../../common/metrics.service';
import {
  CatalogSearchDto,
  CatalogSearchResponseDto,
  CatalogPublicationDto,
  CatalogStatisticsDto,
} from '../dto';
@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  private readonly logger = new Logger(CatalogController.name);
  constructor(
    private searchService: CatalogSearchService,
    private metricsService: MetricsService,
    private catalogService: CatalogService,
  ) {}
  @Get('publications')
  @ApiOperation({ summary: 'Search publications with advanced filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Publications search results', type: CatalogSearchResponseDto })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'type', required: false, enum: ['ARTICLE', 'BOOK'], description: 'Publication type' })
  @ApiQuery({ name: 'author', required: false, description: 'Author name filter' })
  @ApiQuery({ name: 'category', required: false, description: 'Category filter' })
  @ApiQuery({ name: 'isbn', required: false, description: 'ISBN filter (exact match)' })
  @ApiQuery({ name: 'doi', required: false, description: 'DOI filter (exact match)' })
  @ApiQuery({ name: 'yearFrom', required: false, type: Number, description: 'From year' })
  @ApiQuery({ name: 'yearTo', required: false, type: Number, description: 'To year' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Results per page' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['relevance', 'date', 'title'], description: 'Sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @Throttle(30, 60)
  @CacheTTL(300)
  async searchPublications(@Query() searchDto: CatalogSearchDto): Promise<CatalogSearchResponseDto> {
    try {
      return await this.searchService.searchPublications(searchDto);
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);
      throw new HttpException('Search service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
  @Get('publications/:id')
  @ApiOperation({ summary: 'Get publication by ID' })
  @ApiParam({ name: 'id', description: 'Publication ID or original ID' })
  @ApiResponse({ status: 200, description: 'Publication details', type: CatalogPublicationDto })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  @Throttle(60, 60)
  @CacheTTL(600)
  async getPublicationById(@Param('id') id: string): Promise<CatalogPublicationDto> {
    try {
      const publication = await this.searchService.getPublicationById(id);
      if (!publication) {
        throw new HttpException('Publication not found', HttpStatus.NOT_FOUND);
      }
      return publication;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to get publication ${id}: ${error.message}`, error.stack);
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
  @Get('search')
  @ApiOperation({ summary: 'Advanced search with facets (alias for GET /publications)' })
  @ApiResponse({ status: 200, description: 'Search results with facets', type: CatalogSearchResponseDto })
  @Throttle(30, 60)
  @CacheTTL(300)
  async advancedSearch(@Query() searchDto: CatalogSearchDto): Promise<CatalogSearchResponseDto> {
    return this.searchPublications(searchDto);
  }
  @Get('categories')
  @ApiOperation({ summary: 'Get all available categories with publication counts' })
  @ApiResponse({ status: 200, description: 'Categories list', type: [Object] })
  @Throttle(10, 60)
  @CacheTTL(3600)
  async getCategories(): Promise<{ category: string; count: number }[]> {
    try {
      return await this.searchService.getCategories();
    } catch (error) {
      this.logger.error(`Failed to get categories: ${error.message}`, error.stack);
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
  @Get('statistics')
  @ApiOperation({ summary: 'Get catalog statistics and metrics' })
  @ApiResponse({ status: 200, description: 'Catalog statistics', type: CatalogStatisticsDto })
  @Throttle(5, 60)
  @CacheTTL(1800)
  async getStatistics(): Promise<CatalogStatisticsDto> {
    try {
      return await this.metricsService.getCatalogStatistics();
    } catch (error) {
      this.logger.error(`Failed to get statistics: ${error.message}`, error.stack);
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
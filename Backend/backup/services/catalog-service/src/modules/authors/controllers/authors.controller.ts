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
import { CatalogAuthorService } from '../services/catalog-author.service';
import { CatalogAuthorDto, CatalogPublicationDto, PaginationDto } from '../dto';
@ApiTags('Authors')
@Controller('catalog/authors')
export class AuthorsController {
  private readonly logger = new Logger(AuthorsController.name);
  constructor(private authorService: CatalogAuthorService) {}
  @Get()
  @ApiOperation({ summary: 'Get authors with pagination and search' })
  @ApiResponse({ status: 200, description: 'Authors list with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Results per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by author name or affiliation' })
  @Throttle(20, 60)
  @CacheTTL(600)
  async getAuthors(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
  ): Promise<{ authors: CatalogAuthorDto[]; pagination: PaginationDto }> {
    try {
      if (limit > 100) {
        limit = 100;
      }
      return await this.authorService.getAuthors(page, limit, search);
    } catch (error) {
      this.logger.error(`Failed to get authors: ${error.message}`, error.stack);
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
  @Get('top')
  @ApiOperation({ summary: 'Get top authors by publication count' })
  @ApiResponse({ status: 200, description: 'Top authors list', type: [CatalogAuthorDto] })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top authors (default: 10, max: 50)' })
  @Throttle(10, 60)
  @CacheTTL(1800)
  async getTopAuthors(@Query('limit') limit: number = 10): Promise<CatalogAuthorDto[]> {
    try {
      if (limit > 50) {
        limit = 50;
      }
      return await this.authorService.getTopAuthors(limit);
    } catch (error) {
      this.logger.error(`Failed to get top authors: ${error.message}`, error.stack);
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get author by ID' })
  @ApiParam({ name: 'id', description: 'Author ID or original ID' })
  @ApiResponse({ status: 200, description: 'Author details', type: CatalogAuthorDto })
  @ApiResponse({ status: 404, description: 'Author not found' })
  @Throttle(30, 60)
  @CacheTTL(900)
  async getAuthorById(@Param('id') id: string): Promise<CatalogAuthorDto> {
    try {
      const author = await this.authorService.getAuthorById(id);
      if (!author) {
        throw new HttpException('Author not found', HttpStatus.NOT_FOUND);
      }
      return author;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to get author ${id}: ${error.message}`, error.stack);
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
  @Get(':id/publications')
  @ApiOperation({ summary: 'Get publications by author' })
  @ApiParam({ name: 'id', description: 'Author ID or original ID' })
  @ApiResponse({ status: 200, description: 'Author publications with pagination' })
  @ApiResponse({ status: 404, description: 'Author not found' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Results per page (default: 20, max: 100)' })
  @Throttle(20, 60)
  @CacheTTL(600)
  async getAuthorPublications(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{ publications: CatalogPublicationDto[]; pagination: PaginationDto }> {
    try {
      if (limit > 100) {
        limit = 100;
      }
      const result = await this.authorService.getAuthorPublications(id, page, limit);
      if (result.publications.length === 0 && page === 1) {
        const author = await this.authorService.getAuthorById(id);
        if (!author) {
          throw new HttpException('Author not found', HttpStatus.NOT_FOUND);
        }
      }
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to get publications for author ${id}: ${error.message}`, error.stack);
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
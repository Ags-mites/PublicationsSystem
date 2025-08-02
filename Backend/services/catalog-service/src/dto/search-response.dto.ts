import { ApiProperty } from '@nestjs/swagger';
import { CatalogPublicationDto } from './catalog-publication.dto';

export class SearchFacetsDto {
  @ApiProperty({ description: 'Publication types with counts', type: [Object] })
  types: { type: string; count: number }[];

  @ApiProperty({ description: 'Categories with counts', type: [Object] })
  categories: { category: string; count: number }[];

  @ApiProperty({ description: 'Publication years with counts', type: [Object] })
  years: { year: number; count: number }[];

  @ApiProperty({ description: 'Top authors with counts', type: [Object] })
  authors: { authorId: string; authorName: string; count: number }[];
}

export class CatalogSearchResponseDto {
  @ApiProperty({ description: 'Search results', type: [CatalogPublicationDto] })
  publications: CatalogPublicationDto[];

  @ApiProperty({ description: 'Total number of matching results' })
  totalCount: number;

  @ApiProperty({ description: 'Search facets for filtering', type: SearchFacetsDto })
  facets: SearchFacetsDto;

  @ApiProperty({ description: 'Query execution time in milliseconds' })
  executionTime: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Results per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class PaginationDto {
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Results per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of results' })
  totalCount: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}

export class HealthResponseDto {
  @ApiProperty({ description: 'Service status' })
  status: string;

  @ApiProperty({ description: 'Database connection status' })
  database: string;

  @ApiProperty({ description: 'Service uptime in seconds' })
  uptime: number;

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Service version' })
  version: string;
}
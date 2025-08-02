import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CatalogSearchDto {
  @ApiPropertyOptional({ description: 'Search query for title, abstract, or keywords' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['ARTICLE', 'BOOK'], description: 'Publication type filter' })
  @IsOptional()
  @IsEnum(['ARTICLE', 'BOOK'])
  type?: string;

  @ApiPropertyOptional({ description: 'Author name filter (searches primary and co-authors)' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'Category filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter publications from this year onwards' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  yearFrom?: number;

  @ApiPropertyOptional({ description: 'Filter publications up to this year' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  yearTo?: number;

  @ApiPropertyOptional({ default: 1, description: 'Page number for pagination' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, description: 'Number of results per page (max 100)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ 
    enum: ['relevance', 'date', 'title'], 
    default: 'relevance',
    description: 'Sort results by relevance, date, or title' 
  })
  @IsOptional()
  @IsEnum(['relevance', 'date', 'title'])
  sortBy?: string = 'relevance';

  @ApiPropertyOptional({ 
    enum: ['asc', 'desc'], 
    default: 'desc',
    description: 'Sort order' 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'desc';
}
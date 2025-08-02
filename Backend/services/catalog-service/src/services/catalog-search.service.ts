import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from './metrics.service';
import {
  CatalogSearchDto,
  CatalogSearchResponseDto,
  CatalogPublicationDto,
  SearchFacetsDto,
} from '../dto';
import { CatalogStatus } from '@prisma/client';

@Injectable()
export class CatalogSearchService {
  private readonly logger = new Logger(CatalogSearchService.name);

  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsService,
  ) {}

  async searchPublications(searchDto: CatalogSearchDto): Promise<CatalogSearchResponseDto> {
    const startTime = Date.now();
    const { page = 1, limit = 20, q, type, author, category, yearFrom, yearTo, sortBy, sortOrder } = searchDto;
    
    try {
      const whereClause: any = {
        status: CatalogStatus.ACTIVE,
      };

      if (q) {
        whereClause.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { abstract: { contains: q, mode: 'insensitive' } },
          { keywords: { hasSome: q.split(' ').filter(word => word.length > 2) } },
        ];
      }

      if (type) {
        whereClause.type = type;
      }

      if (author) {
        whereClause.OR = whereClause.OR || [];
        whereClause.OR.push(
          { primaryAuthor: { contains: author, mode: 'insensitive' } },
          { coAuthors: { hasSome: [author] } }
        );
      }

      if (category) {
        whereClause.category = { contains: category, mode: 'insensitive' };
      }

      if (yearFrom || yearTo) {
        whereClause.publishedAt = {};
        if (yearFrom) {
          whereClause.publishedAt.gte = new Date(`${yearFrom}-01-01`);
        }
        if (yearTo) {
          whereClause.publishedAt.lte = new Date(`${yearTo}-12-31`);
        }
      }

      const [publications, totalCount, facets] = await Promise.all([
        this.prisma.catalogPublication.findMany({
          where: whereClause,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: this.buildOrderBy(sortBy || 'relevance', sortOrder || 'desc'),
        }),
        this.prisma.catalogPublication.count({ where: whereClause }),
        this.buildFacets(whereClause),
      ]);

      const executionTime = Date.now() - startTime;
      
      await this.recordSearchStatistics(searchDto, totalCount, executionTime);

      const response = {
        publications: publications.map(pub => this.mapToDto(pub)),
        totalCount,
        facets,
        executionTime,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      };

      this.logger.log(`Search completed: query="${q}" results=${totalCount} time=${executionTime}ms`);
      return response;

    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPublicationById(id: string): Promise<CatalogPublicationDto | null> {
    try {
      const publication = await this.prisma.catalogPublication.findFirst({
        where: { 
          OR: [
            { id },
            { originalId: id }
          ],
          status: CatalogStatus.ACTIVE 
        },
      });

      if (!publication) {
        return null;
      }

      await this.incrementViewCount(publication.id);
      return this.mapToDto(publication);

    } catch (error) {
      this.logger.error(`Failed to get publication by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCategories(): Promise<{ category: string; count: number }[]> {
    try {
      const categories = await this.prisma.catalogPublication.groupBy({
        by: ['category'],
        where: { status: CatalogStatus.ACTIVE },
        _count: true,
      });

      return categories.map(cat => ({
        category: cat.category,
        count: cat._count,
      }));

    } catch (error) {
      this.logger.error(`Failed to get categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async buildFacets(baseWhere: any): Promise<SearchFacetsDto> {
    try {
      const [types, categories, years, topAuthors] = await Promise.all([
        this.prisma.catalogPublication.groupBy({
          by: ['type'],
          where: baseWhere,
          _count: true,
        }),
        this.prisma.catalogPublication.groupBy({
          by: ['category'],
          where: baseWhere,
          _count: true,
          orderBy: { category: 'asc' },
          take: 10,
        }),
        this.prisma.$queryRaw<{ year: number; count: number }[]>`
          SELECT EXTRACT(YEAR FROM published_at)::int as year, COUNT(*)::int as count
          FROM catalog_publications 
          WHERE status = 'ACTIVE'
          GROUP BY year 
          ORDER BY year DESC
          LIMIT 10
        `,
        this.prisma.catalogPublication.groupBy({
          by: ['primaryAuthor'],
          where: baseWhere,
          _count: true,
          orderBy: { primaryAuthor: 'asc' },
          take: 10,
        }),
      ]);

      return {
        types: types.map(t => ({ type: t.type, count: t._count })),
        categories: categories.map(c => ({ category: c.category, count: c._count })),
        years: years,
        authors: topAuthors.map(a => ({
          authorId: '', 
          authorName: a.primaryAuthor,
          count: a._count,
        })),
      };

    } catch (error) {
      this.logger.error(`Failed to build facets: ${error.message}`, error.stack);
      return {
        types: [],
        categories: [],
        years: [],
        authors: [],
      };
    }
  }

  private buildOrderBy(sortBy: string, sortOrder: string) {
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'date':
        return { publishedAt: orderDirection as any };
      case 'title':
        return { title: orderDirection as any };
      case 'relevance':
      default:
        return [
          { viewCount: 'desc' as any },
          { publishedAt: 'desc' as any },
        ];
    }
  }

  private async incrementViewCount(publicationId: string): Promise<void> {
    try {
      await this.prisma.catalogPublication.update({
        where: { id: publicationId },
        data: { viewCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.warn(`Failed to increment view count for publication ${publicationId}: ${error.message}`);
    }
  }

  private async recordSearchStatistics(
    searchDto: CatalogSearchDto,
    resultCount: number,
    executionTime: number,
  ): Promise<void> {
    try {
      await this.prisma.searchStatistics.create({
        data: {
          query: searchDto.q || '',
          resultCount,
          executionTimeMs: executionTime,
          filters: {
            type: searchDto.type,
            author: searchDto.author,
            category: searchDto.category,
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            sortBy: searchDto.sortBy,
            sortOrder: searchDto.sortOrder,
          },
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to record search statistics: ${error.message}`);
    }
  }

  private mapToDto(publication: any): CatalogPublicationDto {
    return {
      id: publication.id,
      originalId: publication.originalId,
      title: publication.title,
      abstract: publication.abstract,
      keywords: publication.keywords,
      type: publication.type,
      primaryAuthor: publication.primaryAuthor,
      coAuthors: publication.coAuthors,
      metadata: publication.metadata,
      publishedAt: publication.publishedAt,
      isbn: publication.isbn,
      doi: publication.doi,
      category: publication.category,
      license: publication.license,
      downloadUrl: publication.downloadUrl,
      status: publication.status,
      viewCount: publication.viewCount,
      indexedAt: publication.indexedAt,
    };
  }
}
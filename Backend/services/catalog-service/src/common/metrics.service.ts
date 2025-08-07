import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogStatisticsDto } from './statistics.dto';
import { CatalogStatus } from '@prisma/client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private prisma: PrismaService) {}

  async getCatalogStatistics(): Promise<CatalogStatisticsDto> {
    try {
      const [
        totalPublications,
        totalAuthors,
        totalCategories,
        popularCategories,
        topAuthors,
        publicationsByType,
        recentTrends,
        mostViewed,
      ] = await Promise.all([
        this.getTotalPublications(),
        this.getTotalAuthors(),
        this.getTotalCategories(),
        this.getPopularCategories(5),
        this.getTopAuthors(5),
        this.getPublicationsByType(),
        this.getRecentTrends(5),
        this.getMostViewedPublications(5),
      ]);

      return {
        totalPublications,
        totalAuthors,
        totalCategories,
        popularCategories,
        topAuthors,
        publicationsByType,
        recentTrends,
        mostViewed,
      };

    } catch (error) {
      this.logger.error(`Failed to get catalog statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSearchMetrics(days: number = 30): Promise<any> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [
        totalSearches,
        averageResults,
        averageExecutionTime,
        topQueries,
        searchTrends,
      ] = await Promise.all([
        this.prisma.searchStatistics.count({
          where: { timestamp: { gte: since } },
        }),
        this.prisma.searchStatistics.aggregate({
          where: { timestamp: { gte: since } },
          _avg: { resultCount: true },
        }),
        this.prisma.searchStatistics.aggregate({
          where: { timestamp: { gte: since } },
          _avg: { executionTimeMs: true },
        }),
        this.getTopSearchQueries(10, since),
        this.getSearchTrends(since),
      ]);

      return {
        totalSearches,
        averageResults: Math.round(averageResults._avg.resultCount || 0),
        averageExecutionTime: Math.round(averageExecutionTime._avg.executionTimeMs || 0),
        topQueries,
        searchTrends,
        period: `${days} days`,
      };

    } catch (error) {
      this.logger.error(`Failed to get search metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getTotalPublications(): Promise<number> {
    return this.prisma.catalogPublication.count({
      where: { status: CatalogStatus.ACTIVE },
    });
  }

  private async getTotalAuthors(): Promise<number> {
    return this.prisma.catalogAuthor.count();
  }

  private async getTotalCategories(): Promise<number> {
    const result = await this.prisma.catalogPublication.findMany({
      where: { status: CatalogStatus.ACTIVE },
      select: { category: true },
      distinct: ['category'],
    });
    return result.length;
  }

  private async getPopularCategories(limit: number): Promise<{ category: string; count: number }[]> {
    const categories = await this.prisma.catalogPublication.groupBy({
      by: ['category'],
      where: { status: CatalogStatus.ACTIVE },
      _count: true,
      orderBy: { category: 'asc' },
      take: limit,
    });

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count,
    }));
  }

  private async getTopAuthors(limit: number): Promise<{ authorName: string; publicationCount: number }[]> {
    const authors = await this.prisma.catalogAuthor.findMany({
      take: limit,
      orderBy: { publicationCount: 'desc' },
      where: { publicationCount: { gt: 0 } },
      select: { fullName: true, publicationCount: true },
    });

    return authors.map(author => ({
      authorName: author.fullName,
      publicationCount: author.publicationCount,
    }));
  }

  private async getPublicationsByType(): Promise<{ type: string; count: number }[]> {
    const types = await this.prisma.catalogPublication.groupBy({
      by: ['type'],
      where: { status: CatalogStatus.ACTIVE },
      _count: true,
    });

    return types.map(type => ({
      type: type.type,
      count: type._count,
    }));
  }

  private async getRecentTrends(years: number): Promise<{ year: number; count: number }[]> {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - years + 1;

    const trends = await this.prisma.$queryRaw<{ year: number; count: number }[]>`
      SELECT EXTRACT(YEAR FROM published_at)::int as year, COUNT(*)::int as count
      FROM catalog_publications 
      WHERE status = 'ACTIVE' 
        AND EXTRACT(YEAR FROM published_at) >= ${startYear}
      GROUP BY year 
      ORDER BY year ASC
    `;

    return trends;
  }

  private async getMostViewedPublications(limit: number): Promise<{ title: string; viewCount: number; id: string }[]> {
    const publications = await this.prisma.catalogPublication.findMany({
      where: { 
        status: CatalogStatus.ACTIVE,
        viewCount: { gt: 0 },
      },
      select: { id: true, title: true, viewCount: true },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    return publications.map(pub => ({
      id: pub.id,
      title: pub.title,
      viewCount: pub.viewCount,
    }));
  }

  private async getTopSearchQueries(limit: number, since: Date): Promise<{ query: string; count: number }[]> {
    const queries = await this.prisma.searchStatistics.groupBy({
      by: ['query'],
      where: {
        timestamp: { gte: since },
        query: { not: '' },
      },
      _count: true,
      orderBy: { query: 'asc' },
      take: limit,
    });

    return queries.map(q => ({
      query: q.query,
      count: q._count,
    }));
  }

  private async getSearchTrends(since: Date): Promise<{ date: string; searchCount: number }[]> {
    const trends = await this.prisma.$queryRaw<{ date: string; searchCount: number }[]>`
      SELECT DATE(timestamp) as date, COUNT(*)::int as searchCount
      FROM search_statistics 
      WHERE timestamp >= ${since}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

    return trends;
  }
}
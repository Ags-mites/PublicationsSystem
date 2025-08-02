import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogAuthorDto, CatalogPublicationDto, PaginationDto } from '../dto';
import { CatalogStatus } from '@prisma/client';

@Injectable()
export class CatalogAuthorService {
  private readonly logger = new Logger(CatalogAuthorService.name);

  constructor(private prisma: PrismaService) {}

  async getAuthors(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<{ authors: CatalogAuthorDto[]; pagination: PaginationDto }> {
    try {
      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { affiliation: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [authors, totalCount] = await Promise.all([
        this.prisma.catalogAuthor.findMany({
          where: whereClause,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [
            { publicationCount: 'desc' },
            { lastPublishedAt: 'desc' },
          ],
        }),
        this.prisma.catalogAuthor.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        authors: authors.map(this.mapAuthorToDto),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

    } catch (error) {
      this.logger.error(`Failed to get authors: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAuthorById(id: string): Promise<CatalogAuthorDto | null> {
    try {
      const author = await this.prisma.catalogAuthor.findFirst({
        where: {
          OR: [
            { id },
            { originalId: id },
          ],
        },
      });

      return author ? this.mapAuthorToDto(author) : null;

    } catch (error) {
      this.logger.error(`Failed to get author by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAuthorPublications(
    authorId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ publications: CatalogPublicationDto[]; pagination: PaginationDto }> {
    try {
      const author = await this.getAuthorById(authorId);
      if (!author) {
        return {
          publications: [],
          pagination: {
            page,
            limit,
            totalCount: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      const whereClause = {
        status: CatalogStatus.ACTIVE,
        OR: [
          { primaryAuthor: author.fullName },
          { coAuthors: { has: author.fullName } },
        ],
      };

      const [publications, totalCount] = await Promise.all([
        this.prisma.catalogPublication.findMany({
          where: whereClause,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { publishedAt: 'desc' },
        }),
        this.prisma.catalogPublication.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        publications: publications.map(this.mapPublicationToDto),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

    } catch (error) {
      this.logger.error(`Failed to get author publications: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTopAuthors(limit: number = 10): Promise<CatalogAuthorDto[]> {
    try {
      const authors = await this.prisma.catalogAuthor.findMany({
        take: limit,
        orderBy: [
          { publicationCount: 'desc' },
          { lastPublishedAt: 'desc' },
        ],
        where: {
          publicationCount: { gt: 0 },
        },
      });

      return authors.map(this.mapAuthorToDto);

    } catch (error) {
      this.logger.error(`Failed to get top authors: ${error.message}`, error.stack);
      throw error;
    }
  }

  private mapAuthorToDto(author: any): CatalogAuthorDto {
    return {
      id: author.id,
      originalId: author.originalId,
      fullName: author.fullName,
      affiliation: author.affiliation,
      orcid: author.orcid,
      publicationCount: author.publicationCount,
      lastPublishedAt: author.lastPublishedAt,
    };
  }

  private mapPublicationToDto(publication: any): CatalogPublicationDto {
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
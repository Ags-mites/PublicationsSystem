import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogAuthorService } from './catalog-author.service';
import { 
  PublicationPublishedEvent, 
  PublicationWithdrawnEvent,
  AuthorCreatedEvent,
  AuthorUpdatedEvent 
} from '../interfaces/events.interface';
import { CatalogStatus } from '@prisma/client';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private prisma: PrismaService,
    private authorService: CatalogAuthorService,
  ) {}

  async indexPublication(event: PublicationPublishedEvent): Promise<void> {
    const startTime = Date.now();

    try {
      await this.prisma.catalogPublication.upsert({
        where: { originalId: event.publicationId },
        create: {
          originalId: event.publicationId,
          title: event.title,
          abstract: event.abstract,
          keywords: event.keywords,
          type: event.type,
          primaryAuthor: event.primaryAuthorName,
          coAuthors: event.coAuthorNames,
          metadata: event.metadata,
          publishedAt: new Date(event.publishedAt),
          isbn: event.isbn,
          doi: event.doi,
          category: event.category,
          license: event.license || 'All Rights Reserved',
          downloadUrl: event.downloadUrl,
          status: CatalogStatus.ACTIVE,
        },
        update: {
          title: event.title,
          abstract: event.abstract,
          keywords: event.keywords,
          type: event.type,
          primaryAuthor: event.primaryAuthorName,
          coAuthors: event.coAuthorNames,
          metadata: event.metadata,
          publishedAt: new Date(event.publishedAt),
          isbn: event.isbn,
          doi: event.doi,
          category: event.category,
          license: event.license || 'All Rights Reserved',
          downloadUrl: event.downloadUrl,
          status: CatalogStatus.ACTIVE,
        },
      });

      const executionTime = Date.now() - startTime;
      this.logger.log(`Publication ${event.publicationId} indexed successfully in ${executionTime}ms`);

    } catch (error) {
      this.logger.error(
        `Failed to index publication ${event.publicationId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async withdrawPublication(event: PublicationWithdrawnEvent): Promise<void> {
    try {
      const result = await this.prisma.catalogPublication.updateMany({
        where: { originalId: event.publicationId },
        data: { status: CatalogStatus.WITHDRAWN },
      });

      if (result.count === 0) {
        this.logger.warn(`Publication ${event.publicationId} not found for withdrawal`);
        return;
      }

      this.logger.log(`Publication ${event.publicationId} withdrawn from catalog`);

    } catch (error) {
      this.logger.error(
        `Failed to withdraw publication ${event.publicationId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateAuthorStatistics(authorId: string): Promise<void> {
    try {
      const author = await this.prisma.catalogAuthor.findUnique({
        where: { originalId: authorId },
      });

      if (!author) {
        this.logger.warn(`Author ${authorId} not found for statistics update`);
        return;
      }

      const publicationCount = await this.prisma.catalogPublication.count({
        where: {
          OR: [
            { primaryAuthor: author.fullName },
            { coAuthors: { has: author.fullName } },
          ],
          status: CatalogStatus.ACTIVE,
        },
      });

      const lastPublication = await this.prisma.catalogPublication.findFirst({
        where: {
          OR: [
            { primaryAuthor: author.fullName },
            { coAuthors: { has: author.fullName } },
          ],
          status: CatalogStatus.ACTIVE,
        },
        orderBy: { publishedAt: 'desc' },
        select: { publishedAt: true },
      });

      await this.prisma.catalogAuthor.update({
        where: { originalId: authorId },
        data: {
          publicationCount,
          lastPublishedAt: lastPublication?.publishedAt || author.lastPublishedAt,
        },
      });

      this.logger.log(`Author ${authorId} statistics updated: ${publicationCount} publications`);

    } catch (error) {
      this.logger.error(
        `Failed to update author statistics for ${authorId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async handleAuthorCreated(event: AuthorCreatedEvent): Promise<void> {
    try {
      await this.prisma.catalogAuthor.upsert({
        where: { originalId: event.authorId },
        create: {
          originalId: event.authorId,
          fullName: event.fullName,
          affiliation: event.affiliation,
          orcid: event.orcid,
          publicationCount: 0,
          lastPublishedAt: new Date(event.createdAt),
        },
        update: {
          fullName: event.fullName,
          affiliation: event.affiliation,
          orcid: event.orcid,
        },
      });

      this.logger.log(`Author ${event.authorId} created in catalog`);

    } catch (error) {
      this.logger.error(
        `Failed to create author ${event.authorId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async handleAuthorUpdated(event: AuthorUpdatedEvent): Promise<void> {
    try {
      const updateData: any = {};
      
      if (event.fullName) updateData.fullName = event.fullName;
      if (event.affiliation) updateData.affiliation = event.affiliation;
      if (event.orcid !== undefined) updateData.orcid = event.orcid;

      if (Object.keys(updateData).length === 0) {
        return;
      }

      await this.prisma.catalogAuthor.update({
        where: { originalId: event.authorId },
        data: updateData,
      });

      this.logger.log(`Author ${event.authorId} updated in catalog`);

    } catch (error) {
      this.logger.error(
        `Failed to update author ${event.authorId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getHealthStatus(): Promise<any> {
    try {
      const [totalPublications, totalAuthors, dbConnected] = await Promise.all([
        this.prisma.catalogPublication.count({ where: { status: CatalogStatus.ACTIVE } }),
        this.prisma.catalogAuthor.count(),
        this.checkDatabaseConnection(),
      ]);

      return {
        status: 'healthy',
        database: dbConnected ? 'connected' : 'disconnected',
        totalPublications,
        totalAuthors,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      };

    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
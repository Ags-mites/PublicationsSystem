import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePublicationDto } from '../dto/create-publication.dto';
import { UpdatePublicationDto } from '../dto/update-publication.dto';
import { PublicationResponseDto } from '../dto/publication-response.dto';
import { PublicationStatus, PublicationType } from '@prisma/client';
import { EventsService } from '../../events/events.service';

@Injectable()
export class PublicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  // State machine for publication status transitions
  private readonly allowedTransitions = {
    [PublicationStatus.DRAFT]: [PublicationStatus.IN_REVIEW],
    [PublicationStatus.IN_REVIEW]: [PublicationStatus.CHANGES_REQUESTED, PublicationStatus.APPROVED],
    [PublicationStatus.CHANGES_REQUESTED]: [PublicationStatus.IN_REVIEW],
    [PublicationStatus.APPROVED]: [PublicationStatus.PUBLISHED],
    [PublicationStatus.PUBLISHED]: [PublicationStatus.WITHDRAWN],
  };

  private validateStatusTransition(currentStatus: PublicationStatus, newStatus: PublicationStatus): boolean {
    const allowedNextStatuses = this.allowedTransitions[currentStatus] || [];
    return allowedNextStatuses.includes(newStatus);
  }

  async createPublication(createPublicationDto: CreatePublicationDto, userId: string): Promise<PublicationResponseDto> {
    const { article, book, ...publicationData } = createPublicationDto;

    // Validate that only one type-specific data is provided
    if (article && book) {
      throw new BadRequestException('Cannot provide both article and book data');
    }

    if (publicationData.type === PublicationType.ARTICLE && !article) {
      throw new BadRequestException('Article data is required for ARTICLE type');
    }

    if (publicationData.type === PublicationType.BOOK && !book) {
      throw new BadRequestException('Book data is required for BOOK type');
    }

    // Validate that the user is the primary author
    if (publicationData.primaryAuthorId !== userId) {
      throw new ForbiddenException('You can only create publications as the primary author');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create the publication
      const publication = await tx.publication.create({
        data: {
          ...publicationData,
          status: PublicationStatus.DRAFT,
          metadata: publicationData.metadata || {},
        },
        include: {
          article: true,
          book: true,
        },
      });

      // Create type-specific data
      if (article && publicationData.type === PublicationType.ARTICLE) {
        await tx.article.create({
          data: {
            ...article,
            publicationId: publication.id,
          },
        });
      }

      if (book && publicationData.type === PublicationType.BOOK) {
        await tx.book.create({
          data: {
            ...book,
            publicationId: publication.id,
          },
        });
      }

      // Create outbox event
      await tx.outboxEvent.create({
        data: {
          aggregateId: publication.id,
          aggregateType: 'Publication',
          eventType: 'publication.created',
          payloadJson: {
            id: publication.id,
            title: publication.title,
            type: publication.type,
            primaryAuthorId: publication.primaryAuthorId,
            status: publication.status,
          },
          status: 'PENDING',
        },
      });

      return publication;
    });

    return this.mapToResponseDto(result);
  }

  async findAllPublications(
    filters: {
      primaryAuthorId?: string;
      status?: PublicationStatus;
      type?: PublicationType;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ publications: PublicationResponseDto[]; total: number; page: number; limit: number }> {
    const { primaryAuthorId, status, type, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (primaryAuthorId) where.primaryAuthorId = primaryAuthorId;
    if (status) where.status = status;
    if (type) where.type = type;

    const [publications, total] = await Promise.all([
      this.prisma.publication.findMany({
        where,
        include: {
          article: true,
          book: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.publication.count({ where }),
    ]);

    return {
      publications: publications.map(pub => this.mapToResponseDto(pub)),
      total,
      page,
      limit,
    };
  }

  async findPublicationById(id: string): Promise<PublicationResponseDto> {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
      include: {
        article: true,
        book: true,
      },
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    return this.mapToResponseDto(publication);
  }

  async updatePublication(
    id: string,
    updatePublicationDto: UpdatePublicationDto,
    userId: string,
  ): Promise<PublicationResponseDto> {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
      include: { article: true, book: true },
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    // Only allow updates if publication is in DRAFT status
    if (publication.status !== PublicationStatus.DRAFT) {
      throw new BadRequestException('Only publications in DRAFT status can be updated');
    }

    // Only the primary author can update the publication
    if (publication.primaryAuthorId !== userId) {
      throw new ForbiddenException('Only the primary author can update the publication');
    }

    const { article, book, ...publicationData } = updatePublicationDto;

    const result = await this.prisma.$transaction(async (tx) => {
      // Update the publication
      const updatedPublication = await tx.publication.update({
        where: { id },
        data: {
          ...publicationData,
          metadata: publicationData.metadata || publication.metadata || {},
        },
        include: {
          article: true,
          book: true,
        },
      });

      // Update type-specific data if provided
      if (article && publication.type === PublicationType.ARTICLE) {
        await tx.article.upsert({
          where: { publicationId: id },
          update: article,
          create: {
            ...article,
            publicationId: id,
          },
        });
      }

      if (book && publication.type === PublicationType.BOOK) {
        await tx.book.upsert({
          where: { publicationId: id },
          update: book,
          create: {
            ...book,
            publicationId: id,
          },
        });
      }

      // Create outbox event
      await tx.outboxEvent.create({
        data: {
          aggregateId: id,
          aggregateType: 'Publication',
          eventType: 'publication.updated',
          payloadJson: {
            id,
            title: updatedPublication.title,
            status: updatedPublication.status,
          },
          status: 'PENDING',
        },
      });

      return updatedPublication;
    });

    return this.mapToResponseDto(result);
  }

  async submitForReview(id: string, userId: string): Promise<PublicationResponseDto> {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
      include: { article: true, book: true },
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    // Only the primary author can submit for review
    if (publication.primaryAuthorId !== userId) {
      throw new ForbiddenException('Only the primary author can submit for review');
    }

    // Validate status transition
    if (!this.validateStatusTransition(publication.status, PublicationStatus.IN_REVIEW)) {
      throw new BadRequestException(
        `Cannot transition from ${publication.status} to ${PublicationStatus.IN_REVIEW}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPublication = await tx.publication.update({
        where: { id },
        data: {
          status: PublicationStatus.IN_REVIEW,
          currentVersion: publication.currentVersion + 1,
          submittedAt: new Date(),
        },
        include: {
          article: true,
          book: true,
        },
      });

      // Create outbox event
      await tx.outboxEvent.create({
        data: {
          aggregateId: id,
          aggregateType: 'Publication',
          eventType: 'publication.submitted',
          payloadJson: {
            id,
            title: publication.title,
            type: publication.type,
            primaryAuthorId: publication.primaryAuthorId,
            currentVersion: updatedPublication.currentVersion,
            submittedAt: updatedPublication.submittedAt,
          },
          status: 'PENDING',
        },
      });

      return updatedPublication;
    });

    return this.mapToResponseDto(result);
  }

  async approvePublication(id: string, userId: string): Promise<PublicationResponseDto> {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
      include: { article: true, book: true },
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    // Validate status transition
    if (!this.validateStatusTransition(publication.status, PublicationStatus.APPROVED)) {
      throw new BadRequestException(
        `Cannot transition from ${publication.status} to ${PublicationStatus.APPROVED}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPublication = await tx.publication.update({
        where: { id },
        data: {
          status: PublicationStatus.APPROVED,
        },
        include: {
          article: true,
          book: true,
        },
      });

      // Create outbox event
      await tx.outboxEvent.create({
        data: {
          aggregateId: id,
          aggregateType: 'Publication',
          eventType: 'publication.approved',
          payloadJson: {
            id,
            title: publication.title,
            type: publication.type,
            primaryAuthorId: publication.primaryAuthorId,
            approvedAt: new Date(),
          },
          status: 'PENDING',
        },
      });

      return updatedPublication;
    });

    return this.mapToResponseDto(result);
  }

  async publishPublication(id: string, userId: string): Promise<PublicationResponseDto> {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
      include: { article: true, book: true },
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    // Validate status transition
    if (!this.validateStatusTransition(publication.status, PublicationStatus.PUBLISHED)) {
      throw new BadRequestException(
        `Cannot transition from ${publication.status} to ${PublicationStatus.PUBLISHED}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPublication = await tx.publication.update({
        where: { id },
        data: {
          status: PublicationStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        include: {
          article: true,
          book: true,
        },
      });

      // Create outbox event
      await tx.outboxEvent.create({
        data: {
          aggregateId: id,
          aggregateType: 'Publication',
          eventType: 'publication.published',
          payloadJson: {
            id,
            title: publication.title,
            type: publication.type,
            primaryAuthorId: publication.primaryAuthorId,
            publishedAt: updatedPublication.publishedAt,
          },
          status: 'PENDING',
        },
      });

      return updatedPublication;
    });

    return this.mapToResponseDto(result);
  }

  async withdrawPublication(id: string, userId: string): Promise<PublicationResponseDto> {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
      include: { article: true, book: true },
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    // Only the primary author can withdraw the publication
    if (publication.primaryAuthorId !== userId) {
      throw new ForbiddenException('Only the primary author can withdraw the publication');
    }

    // Validate status transition
    if (!this.validateStatusTransition(publication.status, PublicationStatus.WITHDRAWN)) {
      throw new BadRequestException(
        `Cannot transition from ${publication.status} to ${PublicationStatus.WITHDRAWN}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPublication = await tx.publication.update({
        where: { id },
        data: {
          status: PublicationStatus.WITHDRAWN,
        },
        include: {
          article: true,
          book: true,
        },
      });

      // Create outbox event
      await tx.outboxEvent.create({
        data: {
          aggregateId: id,
          aggregateType: 'Publication',
          eventType: 'publication.withdrawn',
          payloadJson: {
            id,
            title: publication.title,
            type: publication.type,
            primaryAuthorId: publication.primaryAuthorId,
            withdrawnAt: new Date(),
          },
          status: 'PENDING',
        },
      });

      return updatedPublication;
    });

    return this.mapToResponseDto(result);
  }

  async getPublicationHistory(id: string): Promise<any[]> {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    // Get outbox events for this publication
    const events = await this.prisma.outboxEvent.findMany({
      where: {
        aggregateId: id,
        aggregateType: 'Publication',
      },
      orderBy: { createdAt: 'asc' },
    });

    return events.map(event => ({
      eventType: event.eventType,
      payload: event.payloadJson,
      timestamp: event.createdAt,
      status: event.status,
    }));
  }

  private mapToResponseDto(publication: any): PublicationResponseDto {
    return {
      id: publication.id,
      title: publication.title,
      abstract: publication.abstract,
      keywords: publication.keywords,
      status: publication.status,
      currentVersion: publication.currentVersion,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
      primaryAuthorId: publication.primaryAuthorId,
      coAuthorIds: publication.coAuthorIds,
      type: publication.type,
      metadata: publication.metadata,
      submittedAt: publication.submittedAt,
      publishedAt: publication.publishedAt,
      article: publication.article,
      book: publication.book,
    };
  }
}
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventsService } from '../../events/events.service';
import { CreateAuthorDto } from '../dto/create-author.dto';
import { UpdateAuthorDto } from '../dto/update-author.dto';
import { AuthorsRepository } from '../repositories/authors.repository';
import { AuthorEntity } from '../entities/author.entity';
interface AuthorFilters {
  search?: string;
  affiliation?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
interface SearchOptions {
  field?: string;
  page?: number;
  limit?: number;
}
interface PublicationFilters {
  role?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}
interface ReviewFilters {
  status?: string;
  page?: number;
  limit?: number;
}
@Injectable()
export class AuthorsService {
  constructor(
    private readonly authorsRepository: AuthorsRepository,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}
  async findOne(id: string): Promise<AuthorEntity> {
    const author = await this.authorsRepository.findOne(id);
    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }
    return author;
  }
  async findByEmail(email: string): Promise<AuthorEntity | null> {
    return this.authorsRepository.findByEmail(email);
  }
  async findMany(ids: string[]): Promise<AuthorEntity[]> {
    return this.authorsRepository.findMany(ids);
  }
  async createAuthor(createAuthorDto: CreateAuthorDto, currentUserId: string) {
    const { firstName, lastName, email, affiliation, orcid, biography, photoUrl } = createAuthorDto;
    const existingAuthor = await this.prisma.author.findUnique({
      where: { email },
    });
    if (existingAuthor) {
      throw new ConflictException('Author with this email already exists');
    }
    if (orcid) {
      const existingOrcid = await this.prisma.author.findUnique({
        where: { orcid },
      });
      if (existingOrcid) {
        throw new ConflictException('Author with this ORCID already exists');
      }
    }
    const author = await this.prisma.author.create({
      data: {
        firstName,
        lastName,
        email,
        affiliation,
        orcid,
        biography,
        photoUrl,
        isActive: true,
      },
    });
    await this.eventsService.createOutboxEvent(
      author.id,
      'Author',
      'AUTHOR_CREATED',
      {
        authorId: author.id,
        email: author.email,
        fullName: `${author.firstName} ${author.lastName}`,
        createdBy: currentUserId,
      },
    );
    return author;
  }
  async getAllAuthors(filters: AuthorFilters = {}) {
    const { search, affiliation, isActive, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (affiliation) {
      whereClause.affiliation = { contains: affiliation, mode: 'insensitive' };
    }
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }
    const [authors, totalCount] = await Promise.all([
      this.prisma.author.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          affiliation: true,
          orcid: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              primaryPublications: true,
              coAuthoredPublications: true,
              reviews: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.author.count({ where: whereClause }),
    ]);
    return {
      authors,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }
  async getTopContributors(limit: number = 10) {
    const authors = await this.prisma.author.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        affiliation: true,
        orcid: true,
        _count: {
          select: {
            primaryPublications: {
              where: {
                status: {
                  in: ['APPROVED', 'PUBLISHED'],
                },
              },
            },
            coAuthoredPublications: {
              where: {
                status: {
                  in: ['APPROVED', 'PUBLISHED'],
                },
              },
            },
          },
        },
      },
      take: limit,
    });
    const authorsWithTotals = authors
      .map(author => ({
        ...author,
        totalPublications: author._count.primaryPublications + author._count.coAuthoredPublications,
      }))
      .sort((a, b) => b.totalPublications - a.totalPublications)
      .slice(0, limit);
    return authorsWithTotals;
  }
  async searchAuthors(query: string, options: SearchOptions = {}) {
    const { field, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    let whereClause: any;
    switch (field) {
      case 'name':
        whereClause = {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
        };
        break;
      case 'email':
        whereClause = { email: { contains: query, mode: 'insensitive' } };
        break;
      case 'affiliation':
        whereClause = { affiliation: { contains: query, mode: 'insensitive' } };
        break;
      case 'orcid':
        whereClause = { orcid: { contains: query, mode: 'insensitive' } };
        break;
      default:
        whereClause = {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { affiliation: { contains: query, mode: 'insensitive' } },
            { orcid: { contains: query, mode: 'insensitive' } },
          ],
        };
    }
    const [authors, totalCount] = await Promise.all([
      this.prisma.author.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          affiliation: true,
          orcid: true,
          isActive: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.author.count({ where: whereClause }),
    ]);
    return {
      authors,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }
  async getAuthorById(id: string) {
    const author = await this.prisma.author.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            primaryPublications: true,
            coAuthoredPublications: true,
            reviews: true,
          },
        },
      },
    });
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    return author;
  }
  async updateAuthor(id: string, updateAuthorDto: UpdateAuthorDto, currentUserId: string) {
    const { email, orcid, ...otherFields } = updateAuthorDto;
    const author = await this.prisma.author.findUnique({
      where: { id },
    });
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    if (email && email !== author.email) {
      const existingEmail = await this.prisma.author.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException('Author with this email already exists');
      }
    }
    if (orcid && orcid !== author.orcid) {
      const existingOrcid = await this.prisma.author.findUnique({
        where: { orcid },
      });
      if (existingOrcid) {
        throw new ConflictException('Author with this ORCID already exists');
      }
    }
    const updatedAuthor = await this.prisma.author.update({
      where: { id },
      data: {
        email,
        orcid,
        ...otherFields,
      },
    });
    await this.eventsService.createOutboxEvent(
      id,
      'Author',
      'AUTHOR_UPDATED',
      {
        authorId: id,
        updatedFields: Object.keys(updateAuthorDto),
        updatedBy: currentUserId,
      },
    );
    return updatedAuthor;
  }
  async deleteAuthor(id: string, currentUserId: string) {
    const author = await this.prisma.author.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            primaryPublications: true,
            coAuthoredPublications: true,
            reviews: true,
          },
        },
      },
    });
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    if (author._count.primaryPublications > 0 || author._count.coAuthoredPublications > 0) {
      throw new ConflictException('Cannot delete author with associated publications. Deactivate instead.');
    }
    const deactivatedAuthor = await this.prisma.author.update({
      where: { id },
      data: { isActive: false },
    });
    await this.eventsService.createOutboxEvent(
      id,
      'Author',
      'AUTHOR_DELETED',
      {
        authorId: id,
        deletedBy: currentUserId,
      },
    );
    return { message: 'Author deactivated successfully' };
  }
  async getAuthorPublications(id: string, filters: PublicationFilters = {}) {
    const { role, status, type, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const author = await this.prisma.author.findUnique({
      where: { id },
    });
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    let whereClause: any = {};
    if (role === 'primary') {
      whereClause.primaryAuthorId = id;
    } else if (role === 'coauthor') {
      whereClause.coAuthorIds = { has: id };
    } else {
      whereClause.OR = [
        { primaryAuthorId: id },
        { coAuthorIds: { has: id } },
      ];
    }
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    const [publications, totalCount] = await Promise.all([
      this.prisma.publication.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          abstract: true,
          status: true,
          type: true,
          currentVersion: true,
          createdAt: true,
          submittedAt: true,
          publishedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.publication.count({ where: whereClause }),
    ]);
    return {
      author: {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
        email: author.email,
      },
      publications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }
  async getAuthorReviews(id: string, filters: ReviewFilters = {}) {
    const { status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const author = await this.prisma.author.findUnique({
      where: { id },
    });
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    const whereClause: any = { reviewerId: id };
    if (status) whereClause.reviewStatus = status;
    const [reviews, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where: whereClause,
        include: {
          publication: {
            select: {
              id: true,
              title: true,
              status: true,
              type: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: whereClause }),
    ]);
    return {
      author: {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
        email: author.email,
      },
      reviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }
  async getAuthorStatistics(id: string) {
    const author = await this.prisma.author.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            primaryPublications: true,
            coAuthoredPublications: true,
            reviews: true,
          },
        },
      },
    });
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    const publicationsByStatus = await this.prisma.publication.groupBy({
      by: ['status'],
      where: {
        OR: [
          { primaryAuthorId: id },
          { coAuthorIds: { has: id } },
        ],
      },
      _count: true,
    });
    const publicationsByType = await this.prisma.publication.groupBy({
      by: ['type'],
      where: {
        OR: [
          { primaryAuthorId: id },
          { coAuthorIds: { has: id } },
        ],
      },
      _count: true,
    });
    const reviewsByStatus = await this.prisma.review.groupBy({
      by: ['reviewStatus'],
      where: { reviewerId: id },
      _count: true,
    });
    return {
      author: {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
        email: author.email,
        affiliation: author.affiliation,
      },
      publicationStats: {
        totalAsPrimary: author._count.primaryPublications,
        totalAsCoAuthor: author._count.coAuthoredPublications,
        totalPublications: author._count.primaryPublications + author._count.coAuthoredPublications,
        byStatus: publicationsByStatus.map(p => ({
          status: p.status,
          count: p._count,
        })),
        byType: publicationsByType.map(p => ({
          type: p.type,
          count: p._count,
        })),
      },
      reviewStats: {
        totalReviews: author._count.reviews,
        byStatus: reviewsByStatus.map(r => ({
          status: r.reviewStatus,
          count: r._count,
        })),
      },
    };
  }
  async activateAuthor(id: string, currentUserId: string) {
    const author = await this.prisma.author.findUnique({
      where: { id },
    });
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    const updatedAuthor = await this.prisma.author.update({
      where: { id },
      data: { isActive: true },
    });
    await this.eventsService.createOutboxEvent(
      id,
      'Author',
      'AUTHOR_ACTIVATED',
      {
        authorId: id,
        activatedBy: currentUserId,
      },
    );
    return updatedAuthor;
  }
  async deactivateAuthor(id: string, currentUserId: string) {
    const author = await this.prisma.author.findUnique({
      where: { id },
    });
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    const updatedAuthor = await this.prisma.author.update({
      where: { id },
      data: { isActive: false },
    });
    await this.eventsService.createOutboxEvent(
      id,
      'Author',
      'AUTHOR_DEACTIVATED',
      {
        authorId: id,
        deactivatedBy: currentUserId,
      },
    );
    return updatedAuthor;
  }
}
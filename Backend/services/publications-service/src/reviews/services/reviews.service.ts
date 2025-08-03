import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventsService } from '../../events/events.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { CompleteReviewDto } from '../dto/complete-review.dto';
import { ReviewStatus } from '../../common/enums/review-status.enum';
import { PublicationStatus } from '../../common/enums/publication-status.enum';

interface ReviewFilters {
  status?: ReviewStatus;
  publicationId?: string;
  reviewerId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async createReview(createReviewDto: CreateReviewDto, currentUserId: string) {
    const { publicationId, reviewerId, comments, score, changeRequests } = createReviewDto;

    // Verify publication exists and is in reviewable state
    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    if (publication.status !== PublicationStatus.IN_REVIEW) {
      throw new BadRequestException('Publication is not in review status');
    }

    // Verify reviewer exists
    const reviewer = await this.prisma.author.findUnique({
      where: { id: reviewerId },
    });

    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    // Check if review already exists for this publication and reviewer
    const existingReview = await this.prisma.review.findFirst({
      where: {
        publicationId,
        reviewerId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('Review already exists for this publication and reviewer');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Create the review
      const review = await tx.review.create({
        data: {
          publicationId,
          reviewerId,
          reviewStatus: ReviewStatus.IN_PROGRESS,
          comments,
          score,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              affiliation: true,
            },
          },
          publication: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      // Create change requests if provided
      if (changeRequests && changeRequests.length > 0) {
        await tx.changeRequest.createMany({
          data: changeRequests.map(cr => ({
            reviewId: review.id,
            section: cr.section,
            severity: cr.severity,
            description: cr.description,
            suggestion: cr.suggestion,
          })),
        });
      }

      // Publish event
      await this.eventsService.createOutboxEvent(
        review.id,
        'Review',
        'REVIEW_CREATED',
        {
          reviewId: review.id,
          publicationId,
          reviewerId,
          publicationTitle: publication.title,
          reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
        },
      );

      return review;
    });
  }

  async getReviewsByPublication(publicationId: string, filters: ReviewFilters = {}) {
    const { status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = { publicationId };
    if (status) {
      whereClause.reviewStatus = status;
    }

    const [reviews, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where: whereClause,
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              affiliation: true,
            },
          },
          changeRequests: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: whereClause }),
    ]);

    return {
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

  async getReviewsByReviewer(reviewerId: string, filters: ReviewFilters = {}) {
    const { status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = { reviewerId };
    if (status) {
      whereClause.reviewStatus = status;
    }

    const [reviews, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where: whereClause,
        include: {
          publication: {
            select: {
              id: true,
              title: true,
              abstract: true,
              status: true,
              type: true,
            },
          },
          changeRequests: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: whereClause }),
    ]);

    return {
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

  async getReviewById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            affiliation: true,
          },
        },
        publication: {
          select: {
            id: true,
            title: true,
            abstract: true,
            status: true,
            type: true,
          },
        },
        changeRequests: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async completeReview(id: string, completeReviewDto: CompleteReviewDto, currentUserId: string) {
    const { finalStatus, comments, score } = completeReviewDto;

    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: true,
        publication: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the assigned reviewer can complete the review
    if (review.reviewerId !== currentUserId) {
      throw new ForbiddenException('Only the assigned reviewer can complete this review');
    }

    if (review.reviewStatus === ReviewStatus.ACCEPTED || review.reviewStatus === ReviewStatus.REJECTED) {
      throw new BadRequestException('Review is already completed');
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedReview = await tx.review.update({
        where: { id },
        data: {
          reviewStatus: finalStatus,
          comments,
          score,
          updatedAt: new Date(),
        },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          publication: {
            select: {
              id: true,
              title: true,
            },
          },
          changeRequests: true,
        },
      });

      // Publish event
      await this.eventsService.createOutboxEvent(
        review.id,
        'Review',
        'REVIEW_COMPLETED',
        {
          reviewId: review.id,
          publicationId: review.publicationId,
          reviewerId: review.reviewerId,
          finalStatus,
          publicationTitle: review.publication.title,
          reviewerName: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
        },
      );

      return updatedReview;
    });
  }

  async assignReview(id: string, reviewerId: string, currentUserId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { publication: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Verify new reviewer exists
    const reviewer = await this.prisma.author.findUnique({
      where: { id: reviewerId },
    });

    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedReview = await tx.review.update({
        where: { id },
        data: {
          reviewerId,
          reviewStatus: ReviewStatus.PENDING,
          updatedAt: new Date(),
        },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          publication: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Publish event
      await this.eventsService.createOutboxEvent(
        review.id,
        'Review',
        'REVIEW_ASSIGNED',
        {
          reviewId: review.id,
          publicationId: review.publicationId,
          reviewerId,
          publicationTitle: review.publication.title,
          reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
        },
      );

      return updatedReview;
    });
  }

  async deleteReview(id: string, currentUserId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete change requests first (cascade should handle this, but being explicit)
      await tx.changeRequest.deleteMany({
        where: { reviewId: id },
      });

      // Delete the review
      await tx.review.delete({
        where: { id },
      });

      // Publish event
      await this.eventsService.createOutboxEvent(
        id,
        'Review',
        'REVIEW_DELETED',
        {
          reviewId: id,
          publicationId: review.publicationId,
          deletedBy: currentUserId,
        },
      );
    });

    return { message: 'Review deleted successfully' };
  }

  async getChangeRequests(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const changeRequests = await this.prisma.changeRequest.findMany({
      where: { reviewId },
      orderBy: { severity: 'desc' },
    });

    return changeRequests;
  }

  async getAllReviews(filters: ReviewFilters = {}) {
    const { status, publicationId, reviewerId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (status) whereClause.reviewStatus = status;
    if (publicationId) whereClause.publicationId = publicationId;
    if (reviewerId) whereClause.reviewerId = reviewerId;

    const [reviews, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where: whereClause,
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              affiliation: true,
            },
          },
          publication: {
            select: {
              id: true,
              title: true,
              status: true,
              type: true,
            },
          },
          changeRequests: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: whereClause }),
    ]);

    return {
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
}
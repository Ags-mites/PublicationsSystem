import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationProcessingService } from '../services/notification-processing.service';
import {
  UserRegisteredEvent,
  UserLoginEvent,
  PublicationSubmittedEvent,
  PublicationApprovedEvent,
  PublicationPublishedEvent,
  ReviewRequestedEvent,
  ReviewCompletedEvent,
} from '../interfaces/events.interface';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationEventsConsumer {
  private readonly logger = new Logger(NotificationEventsConsumer.name);

  constructor(
    private notificationProcessingService: NotificationProcessingService,
  ) {}

  @EventPattern('user.registered')
  async handleUserRegistered(@Payload() event: UserRegisteredEvent): Promise<void> {
    try {
      this.logger.log(`Processing user.registered event for user ${event.userId}`);

      await this.notificationProcessingService.processNotificationEvent({
        eventType: 'user.registered',
        notificationType: NotificationType.USER_REGISTERED,
        targetUsers: [event.userId],
        templateVariables: {
          firstName: event.firstName,
          lastName: event.lastName,
          email: event.email,
          registeredAt: new Date(event.registeredAt).toLocaleString(),
        },
        metadata: {
          userId: event.userId,
          email: event.email,
        },
      });

      this.logger.log(`User registration notification processed for ${event.userId}`);

    } catch (error) {
      this.logger.error(
        `Failed to process user.registered event for ${event.userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @EventPattern('user.login')
  async handleUserLogin(@Payload() event: UserLoginEvent): Promise<void> {
    try {
      this.logger.log(`Processing user.login event for user ${event.userId}`);

      // Only send login notifications if enabled in user preferences
      await this.notificationProcessingService.processNotificationEvent({
        eventType: 'user.login',
        notificationType: NotificationType.USER_LOGIN,
        targetUsers: [event.userId],
        templateVariables: {
          firstName: event.firstName,
          email: event.email,
          loginAt: new Date(event.loginAt).toLocaleString(),
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        },
        metadata: {
          userId: event.userId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        },
        priority: 1, // Low priority
      });

      this.logger.log(`User login notification processed for ${event.userId}`);

    } catch (error) {
      this.logger.error(
        `Failed to process user.login event for ${event.userId}: ${error.message}`,
        error.stack,
      );
      // Don't throw for login events to avoid blocking other notifications
    }
  }

  @EventPattern('publication.submitted')
  async handlePublicationSubmitted(@Payload() event: PublicationSubmittedEvent): Promise<void> {
    try {
      this.logger.log(`Processing publication.submitted event for publication ${event.publicationId}`);

      await this.notificationProcessingService.processNotificationEvent({
        eventType: 'publication.submitted',
        notificationType: NotificationType.PUBLICATION_SUBMITTED,
        targetUsers: [event.authorId],
        templateVariables: {
          authorName: event.authorName,
          title: event.title,
          submittedAt: new Date(event.submittedAt).toLocaleString(),
          category: event.category,
        },
        metadata: {
          publicationId: event.publicationId,
          authorId: event.authorId,
          category: event.category,
        },
        priority: 2, // Normal priority
      });

      this.logger.log(`Publication submission notification processed for ${event.publicationId}`);

    } catch (error) {
      this.logger.error(
        `Failed to process publication.submitted event for ${event.publicationId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @EventPattern('publication.approved')
  async handlePublicationApproved(@Payload() event: PublicationApprovedEvent): Promise<void> {
    try {
      this.logger.log(`Processing publication.approved event for publication ${event.publicationId}`);

      await this.notificationProcessingService.processNotificationEvent({
        eventType: 'publication.approved',
        notificationType: NotificationType.PUBLICATION_APPROVED,
        targetUsers: [event.authorId],
        templateVariables: {
          authorName: event.authorName,
          title: event.title,
          approvedAt: new Date(event.approvedAt).toLocaleString(),
          approvedBy: event.approvedBy,
        },
        metadata: {
          publicationId: event.publicationId,
          authorId: event.authorId,
          approvedBy: event.approvedBy,
        },
        priority: 3, // High priority
      });

      this.logger.log(`Publication approval notification processed for ${event.publicationId}`);

    } catch (error) {
      this.logger.error(
        `Failed to process publication.approved event for ${event.publicationId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @EventPattern('publication.published')
  async handlePublicationPublished(@Payload() event: PublicationPublishedEvent): Promise<void> {
    try {
      this.logger.log(`Processing publication.published event for publication ${event.publicationId}`);

      await this.notificationProcessingService.processNotificationEvent({
        eventType: 'publication.published',
        notificationType: NotificationType.PUBLICATION_PUBLISHED,
        targetUsers: [event.authorId],
        templateVariables: {
          authorName: event.authorName,
          title: event.title,
          publishedAt: new Date(event.publishedAt).toLocaleString(),
          category: event.category,
          doi: event.doi,
        },
        metadata: {
          publicationId: event.publicationId,
          authorId: event.authorId,
          category: event.category,
          doi: event.doi,
        },
        priority: 3, // High priority
      });

      this.logger.log(`Publication published notification processed for ${event.publicationId}`);

    } catch (error) {
      this.logger.error(
        `Failed to process publication.published event for ${event.publicationId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @EventPattern('publication.review.requested')
  async handleReviewRequested(@Payload() event: ReviewRequestedEvent): Promise<void> {
    try {
      this.logger.log(`Processing review.requested event for review ${event.reviewId}`);

      await this.notificationProcessingService.processNotificationEvent({
        eventType: 'review.requested',
        notificationType: NotificationType.REVIEW_REQUESTED,
        targetUsers: [event.reviewerId],
        templateVariables: {
          reviewerName: event.reviewerName,
          publicationTitle: event.publicationTitle,
          requestedAt: new Date(event.requestedAt).toLocaleString(),
          dueDate: new Date(event.dueDate).toLocaleString(),
        },
        metadata: {
          reviewId: event.reviewId,
          publicationId: event.publicationId,
          reviewerId: event.reviewerId,
          authorId: event.authorId,
          dueDate: event.dueDate,
        },
        priority: 3, // High priority
      });

      this.logger.log(`Review request notification processed for ${event.reviewId}`);

    } catch (error) {
      this.logger.error(
        `Failed to process review.requested event for ${event.reviewId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @EventPattern('publication.review.completed')
  async handleReviewCompleted(@Payload() event: ReviewCompletedEvent): Promise<void> {
    try {
      this.logger.log(`Processing review.completed event for review ${event.reviewId}`);

      // Notify the author
      await this.notificationProcessingService.processNotificationEvent({
        eventType: 'review.completed',
        notificationType: NotificationType.REVIEW_COMPLETED,
        targetUsers: [event.authorId],
        templateVariables: {
          publicationTitle: event.publicationTitle,
          reviewerName: event.reviewerName,
          completedAt: new Date(event.completedAt).toLocaleString(),
          decision: event.decision,
          comments: event.comments,
        },
        metadata: {
          reviewId: event.reviewId,
          publicationId: event.publicationId,
          reviewerId: event.reviewerId,
          authorId: event.authorId,
          decision: event.decision,
        },
        priority: 3, // High priority
      });

      // If changes are requested, send a specific notification
      if (event.decision === 'changes_requested') {
        await this.notificationProcessingService.processNotificationEvent({
          eventType: 'changes.requested',
          notificationType: NotificationType.CHANGES_REQUESTED,
          targetUsers: [event.authorId],
          templateVariables: {
            publicationTitle: event.publicationTitle,
            reviewerName: event.reviewerName,
            completedAt: new Date(event.completedAt).toLocaleString(),
            comments: event.comments,
          },
          metadata: {
            reviewId: event.reviewId,
            publicationId: event.publicationId,
            reviewerId: event.reviewerId,
            authorId: event.authorId,
          },
          priority: 3, // High priority
        });
      }

      this.logger.log(`Review completion notification processed for ${event.reviewId}`);

    } catch (error) {
      this.logger.error(
        `Failed to process review.completed event for ${event.reviewId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Health check method
  getConsumerStats(): any {
    return {
      serviceName: 'NotificationEventsConsumer',
      status: 'active',
      timestamp: new Date().toISOString(),
    };
  }
}
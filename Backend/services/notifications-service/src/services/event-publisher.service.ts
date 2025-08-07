import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RmqOptions } from '@nestjs/microservices';

export interface BaseEvent {
  eventId: string;
  timestamp: string;
  source: string;
}

export interface UserRegisteredEvent extends BaseEvent {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  registeredAt: string;
}

export interface UserLoginEvent extends BaseEvent {
  userId: string;
  firstName: string;
  email: string;
  loginAt: string;
  ipAddress: string;
  userAgent: string;
}

export interface PublicationSubmittedEvent extends BaseEvent {
  publicationId: string;
  authorId: string;
  title: string;
  submittedAt: string;
}

export interface PublicationApprovedEvent extends BaseEvent {
  publicationId: string;
  authorId: string;
  title: string;
  approvedAt: string;
  approvedBy: string;
}

export interface PublicationPublishedEvent extends BaseEvent {
  publicationId: string;
  authorId: string;
  title: string;
  publishedAt: string;
  publishedUrl: string;
}

export interface ReviewRequestedEvent extends BaseEvent {
  publicationId: string;
  authorId: string;
  reviewerId: string;
  title: string;
  requestedAt: string;
}

export interface ReviewCompletedEvent extends BaseEvent {
  publicationId: string;
  authorId: string;
  reviewerId: string;
  title: string;
  completedAt: string;
  status: 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
}

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);
  private client: ClientProxy;

  constructor(private configService: ConfigService) {
    const rmqOptions: RmqOptions = {
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.get<string>('rabbitmq.url') || 'amqp://admin:admin123@localhost:5672'],
        queue: this.configService.get<string>('rabbitmq.queue') || 'notifications_queue',
        queueOptions: {
          durable: true,
        },
      },
    };
    this.client = ClientProxyFactory.create(rmqOptions);
  }

  async onModuleInit() {
    await this.client.connect();
    this.logger.log('Event publisher service initialized');
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  private createBaseEvent(eventType: string): BaseEvent {
    return {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      source: 'notifications-service',
    };
  }

  async publishUserRegistered(event: Omit<UserRegisteredEvent, keyof BaseEvent>): Promise<void> {
    const fullEvent: UserRegisteredEvent = {
      ...this.createBaseEvent('user.registered'),
      ...event,
    };

    try {
      await firstValueFrom(
        this.client.emit('user.registered', fullEvent)
      );
      this.logger.log(`Published user.registered event for user ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to publish user.registered event: ${error.message}`);
      throw error;
    }
  }

  async publishUserLogin(event: Omit<UserLoginEvent, keyof BaseEvent>): Promise<void> {
    const fullEvent: UserLoginEvent = {
      ...this.createBaseEvent('user.login'),
      ...event,
    };

    try {
      await firstValueFrom(
        this.client.emit('user.login', fullEvent)
      );
      this.logger.log(`Published user.login event for user ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to publish user.login event: ${error.message}`);
      throw error;
    }
  }

  async publishPublicationSubmitted(event: Omit<PublicationSubmittedEvent, keyof BaseEvent>): Promise<void> {
    const fullEvent: PublicationSubmittedEvent = {
      ...this.createBaseEvent('publication.submitted'),
      ...event,
    };

    try {
      await firstValueFrom(
        this.client.emit('publication.submitted', fullEvent)
      );
      this.logger.log(`Published publication.submitted event for publication ${event.publicationId}`);
    } catch (error) {
      this.logger.error(`Failed to publish publication.submitted event: ${error.message}`);
      throw error;
    }
  }

  async publishPublicationApproved(event: Omit<PublicationApprovedEvent, keyof BaseEvent>): Promise<void> {
    const fullEvent: PublicationApprovedEvent = {
      ...this.createBaseEvent('publication.approved'),
      ...event,
    };

    try {
      await firstValueFrom(
        this.client.emit('publication.approved', fullEvent)
      );
      this.logger.log(`Published publication.approved event for publication ${event.publicationId}`);
    } catch (error) {
      this.logger.error(`Failed to publish publication.approved event: ${error.message}`);
      throw error;
    }
  }

  async publishPublicationPublished(event: Omit<PublicationPublishedEvent, keyof BaseEvent>): Promise<void> {
    const fullEvent: PublicationPublishedEvent = {
      ...this.createBaseEvent('publication.published'),
      ...event,
    };

    try {
      await firstValueFrom(
        this.client.emit('publication.published', fullEvent)
      );
      this.logger.log(`Published publication.published event for publication ${event.publicationId}`);
    } catch (error) {
      this.logger.error(`Failed to publish publication.published event: ${error.message}`);
      throw error;
    }
  }

  async publishReviewRequested(event: Omit<ReviewRequestedEvent, keyof BaseEvent>): Promise<void> {
    const fullEvent: ReviewRequestedEvent = {
      ...this.createBaseEvent('publication.review.requested'),
      ...event,
    };

    try {
      await firstValueFrom(
        this.client.emit('publication.review.requested', fullEvent)
      );
      this.logger.log(`Published publication.review.requested event for publication ${event.publicationId}`);
    } catch (error) {
      this.logger.error(`Failed to publish publication.review.requested event: ${error.message}`);
      throw error;
    }
  }

  async publishReviewCompleted(event: Omit<ReviewCompletedEvent, keyof BaseEvent>): Promise<void> {
    const fullEvent: ReviewCompletedEvent = {
      ...this.createBaseEvent('publication.review.completed'),
      ...event,
    };

    try {
      await firstValueFrom(
        this.client.emit('publication.review.completed', fullEvent)
      );
      this.logger.log(`Published publication.review.completed event for publication ${event.publicationId}`);
    } catch (error) {
      this.logger.error(`Failed to publish publication.review.completed event: ${error.message}`);
      throw error;
    }
  }

  async publishCustomEvent(eventType: string, payload: any): Promise<void> {
    const event = {
      ...this.createBaseEvent(eventType),
      ...payload,
    };

    try {
      await firstValueFrom(
        this.client.emit(eventType, event)
      );
      this.logger.log(`Published custom event: ${eventType}`);
    } catch (error) {
      this.logger.error(`Failed to publish custom event ${eventType}: ${error.message}`);
      throw error;
    }
  }
} 
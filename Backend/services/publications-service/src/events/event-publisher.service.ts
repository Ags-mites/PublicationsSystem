import { Injectable, Logger } from '@nestjs/common';
import { OutboxService } from './outbox/outbox.service';

export interface DomainEvent {
  getEventType(): string;
  getAggregateId(): string;
  getPayload(): any;
  getOccurredOn(): Date;
}

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(private readonly outboxService: OutboxService) {}

  async publishEvent(event: DomainEvent): Promise<void> {
    try {
      await this.outboxService.saveEvent({
        aggregateId: event.getAggregateId(),
        aggregateType: this.getAggregateType(event.getEventType()),
        eventType: event.getEventType(),
        payloadJson: event.getPayload(),
      });

      this.logger.log(`Event saved to outbox: ${event.getEventType()} for aggregate ${event.getAggregateId()}`);
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.getEventType()}`, error);
      throw error;
    }
  }

  async publishEvents(events: DomainEvent[]): Promise<void> {
    try {
      const outboxEvents = events.map(event => ({
        aggregateId: event.getAggregateId(),
        aggregateType: this.getAggregateType(event.getEventType()),
        eventType: event.getEventType(),
        payloadJson: event.getPayload(),
      }));

      await this.outboxService.saveEvents(outboxEvents);

      this.logger.log(`${events.length} events saved to outbox`);
    } catch (error) {
      this.logger.error('Failed to publish events', error);
      throw error;
    }
  }

  private getAggregateType(eventType: string): string {
    if (eventType.startsWith('publication.')) {
      return 'Publication';
    }
    if (eventType.startsWith('review.')) {
      return 'Review';
    }
    if (eventType.startsWith('author.')) {
      return 'Author';
    }
    return 'Unknown';
  }
}
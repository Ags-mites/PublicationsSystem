import { Injectable, Logger } from '@nestjs/common';
import { OutboxRepository } from './outbox.repository';
import { OutboxEventEntity } from './outbox.entity';

export interface CreateOutboxEventDto {
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payloadJson: any;
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly outboxRepository: OutboxRepository) {}

  async saveEvent(eventDto: CreateOutboxEventDto): Promise<OutboxEventEntity> {
    try {
      const outboxEvent = await this.outboxRepository.create(eventDto);
      this.logger.log(`Outbox event created: ${eventDto.eventType} for ${eventDto.aggregateType}:${eventDto.aggregateId}`);
      return outboxEvent;
    } catch (error) {
      this.logger.error('Failed to save outbox event', error);
      throw error;
    }
  }

  async saveEvents(eventsDto: CreateOutboxEventDto[]): Promise<OutboxEventEntity[]> {
    try {
      const outboxEvents = await this.outboxRepository.createMany(eventsDto);
      this.logger.log(`${eventsDto.length} outbox events created`);
      return outboxEvents;
    } catch (error) {
      this.logger.error('Failed to save outbox events', error);
      throw error;
    }
  }

  async getPendingEvents(limit: number = 100): Promise<OutboxEventEntity[]> {
    return this.outboxRepository.findPendingEvents(limit);
  }

  async getFailedEvents(limit: number = 100): Promise<OutboxEventEntity[]> {
    return this.outboxRepository.findFailedEvents(limit);
  }

  async markEventAsSent(eventId: string): Promise<void> {
    await this.outboxRepository.markAsSent(eventId);
  }

  async markEventAsFailed(eventId: string): Promise<void> {
    await this.outboxRepository.markAsFailed(eventId);
  }

  async markEventsAsSent(eventIds: string[]): Promise<void> {
    await this.outboxRepository.markManyAsSent(eventIds);
  }

  async markEventsAsFailed(eventIds: string[]): Promise<void> {
    await this.outboxRepository.markManyAsFailed(eventIds);
  }

  async getEventMetrics() {
    const [pending, sent, failed] = await Promise.all([
      this.outboxRepository.countByStatus('PENDING'),
      this.outboxRepository.countByStatus('SENT'),
      this.outboxRepository.countByStatus('FAILED'),
    ]);

    return {
      pending,
      sent,
      failed,
      total: pending + sent + failed,
    };
  }

  async cleanupOldEvents(olderThanDays: number = 30): Promise<number> {
    return this.outboxRepository.deleteOldSentEvents(olderThanDays);
  }
}
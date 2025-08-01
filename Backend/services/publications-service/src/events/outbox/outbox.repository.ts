import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { OutboxEventEntity, OutboxStatus } from './outbox.entity';
import { CreateOutboxEventDto } from './outbox.service';

@Injectable()
export class OutboxRepository {
  constructor(private readonly database: DatabaseService) {}

  async create(eventDto: CreateOutboxEventDto): Promise<OutboxEventEntity> {
    const event = await this.database.outboxEvent.create({
      data: {
        aggregateId: eventDto.aggregateId,
        aggregateType: eventDto.aggregateType,
        eventType: eventDto.eventType,
        payloadJson: eventDto.payloadJson,
        status: OutboxStatus.PENDING,
      },
    });

    return new OutboxEventEntity(event);
  }

  async createMany(eventsDto: CreateOutboxEventDto[]): Promise<OutboxEventEntity[]> {
    const data = eventsDto.map(eventDto => ({
      aggregateId: eventDto.aggregateId,
      aggregateType: eventDto.aggregateType,
      eventType: eventDto.eventType,
      payloadJson: eventDto.payloadJson,
      status: OutboxStatus.PENDING,
    }));

    await this.database.outboxEvent.createMany({ data });

    // Return created events (simplified - in production might want to return actual created records)
    return data.map(d => new OutboxEventEntity({ ...d, id: '', createdAt: new Date(), retryCount: 0 }));
  }

  async findPendingEvents(limit: number): Promise<OutboxEventEntity[]> {
    const events = await this.database.outboxEvent.findMany({
      where: { status: OutboxStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return events.map(event => new OutboxEventEntity(event));
  }

  async findFailedEvents(limit: number): Promise<OutboxEventEntity[]> {
    const events = await this.database.outboxEvent.findMany({
      where: { 
        status: OutboxStatus.FAILED,
        retryCount: { lt: 3 },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return events.map(event => new OutboxEventEntity(event));
  }

  async markAsSent(eventId: string): Promise<void> {
    await this.database.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: OutboxStatus.SENT,
        processedAt: new Date(),
      },
    });
  }

  async markAsFailed(eventId: string): Promise<void> {
    await this.database.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: OutboxStatus.FAILED,
        retryCount: { increment: 1 },
      },
    });
  }

  async markManyAsSent(eventIds: string[]): Promise<void> {
    await this.database.outboxEvent.updateMany({
      where: { id: { in: eventIds } },
      data: {
        status: OutboxStatus.SENT,
        processedAt: new Date(),
      },
    });
  }

  async markManyAsFailed(eventIds: string[]): Promise<void> {
    await this.database.outboxEvent.updateMany({
      where: { id: { in: eventIds } },
      data: {
        status: OutboxStatus.FAILED,
        retryCount: { increment: 1 },
      },
    });
  }

  async countByStatus(status: string): Promise<number> {
    return this.database.outboxEvent.count({
      where: { status: status as OutboxStatus },
    });
  }

  async deleteOldSentEvents(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.database.outboxEvent.deleteMany({
      where: {
        status: OutboxStatus.SENT,
        processedAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}
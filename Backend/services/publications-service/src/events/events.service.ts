import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createOutboxEvent(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    payload: any,
  ): Promise<void> {
    await this.prisma.outboxEvent.create({
      data: {
        aggregateId,
        aggregateType,
        eventType,
        payloadJson: payload,
        status: 'PENDING',
      },
    });
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processOutboxEvents(): Promise<void> {
    try {
      const pendingEvents = await this.prisma.outboxEvent.findMany({
        where: {
          status: 'PENDING',
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 10, // Process 10 events at a time
      });

      for (const event of pendingEvents) {
        try {
          // Here you would typically publish to RabbitMQ or other message broker
          // For now, we'll just mark it as sent
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'SENT',
              processedAt: new Date(),
            },
          });

          this.logger.log(`Processed event ${event.eventType} for aggregate ${event.aggregateId}`);
        } catch (error) {
          this.logger.error(`Failed to process event ${event.id}:`, error);
          
          // Update retry count
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              retryCount: event.retryCount + 1,
              status: event.retryCount >= 3 ? 'FAILED' : 'PENDING',
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Error processing outbox events:', error);
    }
  }
} 
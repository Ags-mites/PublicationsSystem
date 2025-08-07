import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}
  async onModuleInit() {
    this.logger.log('RabbitMQ connection disabled for development');
  }
  async onModuleDestroy() {
  }
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
  async processOutboxEvents(): Promise<void> {
    this.logger.log('RabbitMQ outbox processing disabled for development');
  }
} 
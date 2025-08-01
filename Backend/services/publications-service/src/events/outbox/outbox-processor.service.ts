import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxService } from './outbox.service';
import { RabbitMQPublisherService } from './rabbitmq-publisher.service';
import { OutboxEventEntity } from './outbox.entity';

@Injectable()
export class OutboxProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private isProcessing = false;
  private readonly batchSize: number;
  private readonly maxRetries: number;

  constructor(
    private readonly outboxService: OutboxService,
    private readonly rabbitmqPublisher: RabbitMQPublisherService,
    private readonly configService: ConfigService,
  ) {
    this.batchSize = this.configService.get<number>('rabbitmq.batchSize', 50);
    this.maxRetries = this.configService.get<number>('rabbitmq.maxRetries', 3);
  }

  async onModuleInit() {
    this.logger.log('Outbox processor service initialized');
    // Process events immediately on startup
    setTimeout(() => this.processEvents(), 5000);
  }

  async onModuleDestroy() {
    this.logger.log('Outbox processor service destroyed');
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processEvents(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      await this.processPendingEvents();
      await this.retryFailedEvents();
    } catch (error) {
      this.logger.error('Error processing outbox events', error);
    } finally {
      this.isProcessing = false;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldEvents(): Promise<void> {
    try {
      const deletedCount = await this.outboxService.cleanupOldEvents(30);
      this.logger.log(`Cleaned up ${deletedCount} old outbox events`);
    } catch (error) {
      this.logger.error('Error cleaning up old events', error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async logMetrics(): Promise<void> {
    try {
      const metrics = await this.outboxService.getEventMetrics();
      this.logger.log(`Outbox metrics: ${JSON.stringify(metrics)}`);

      if (metrics.pending > 1000) {
        this.logger.warn(`High pending event count: ${metrics.pending}`);
      }

      if (metrics.failed > 100) {
        this.logger.warn(`High failed event count: ${metrics.failed}`);
      }
    } catch (error) {
      this.logger.error('Error logging metrics', error);
    }
  }

  private async processPendingEvents(): Promise<void> {
    const pendingEvents = await this.outboxService.getPendingEvents(this.batchSize);

    if (pendingEvents.length === 0) {
      return;
    }

    this.logger.log(`Processing ${pendingEvents.length} pending events`);

    const { successful, failed } = await this.publishEvents(pendingEvents);

    if (successful.length > 0) {
      await this.outboxService.markEventsAsSent(successful.map(e => e.id));
      this.logger.log(`Successfully processed ${successful.length} events`);
    }

    if (failed.length > 0) {
      await this.outboxService.markEventsAsFailed(failed.map(e => e.id));
      this.logger.warn(`Failed to process ${failed.length} events`);
    }
  }

  private async retryFailedEvents(): Promise<void> {
    const failedEvents = await this.outboxService.getFailedEvents(this.batchSize);

    if (failedEvents.length === 0) {
      return;
    }

    const retryableEvents = failedEvents.filter(event => event.canRetry());

    if (retryableEvents.length === 0) {
      return;
    }

    this.logger.log(`Retrying ${retryableEvents.length} failed events`);

    const { successful, failed } = await this.publishEvents(retryableEvents);

    if (successful.length > 0) {
      await this.outboxService.markEventsAsSent(successful.map(e => e.id));
      this.logger.log(`Successfully retried ${successful.length} events`);
    }

    if (failed.length > 0) {
      await this.outboxService.markEventsAsFailed(failed.map(e => e.id));
      this.logger.warn(`Failed to retry ${failed.length} events`);
    }
  }

  private async publishEvents(events: OutboxEventEntity[]): Promise<{
    successful: OutboxEventEntity[];
    failed: OutboxEventEntity[];
  }> {
    const successful: OutboxEventEntity[] = [];
    const failed: OutboxEventEntity[] = [];

    for (const event of events) {
      try {
        await this.rabbitmqPublisher.publishEvent(event);
        successful.push(event);
      } catch (error) {
        this.logger.error(`Failed to publish event ${event.id}: ${error.message}`);
        failed.push(event);
      }
    }

    return { successful, failed };
  }
}
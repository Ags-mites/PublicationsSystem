import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.connectToRabbitMQ();
  }

  async onModuleDestroy() {
    await this.closeConnection();
  }

  private async connectToRabbitMQ() {
    try {
      const rabbitmqUrl = this.configService.get<string>('rabbitmq.url');
      const exchange = this.configService.get<string>('rabbitmq.exchange');

      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      // Declare exchange
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      
      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
    }
  }

  private async closeConnection() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
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
          if (this.channel) {
            const exchange = this.configService.get<string>('rabbitmq.exchange');
            const routingKey = `${event.aggregateType}.${event.eventType}`;
            
            const message = {
              id: event.id,
              aggregateId: event.aggregateId,
              aggregateType: event.aggregateType,
              eventType: event.eventType,
              payload: event.payloadJson,
              timestamp: event.createdAt,
            };

            this.channel.publish(
              exchange,
              routingKey,
              Buffer.from(JSON.stringify(message)),
              { persistent: true }
            );

            await this.prisma.outboxEvent.update({
              where: { id: event.id },
              data: {
                status: 'SENT',
                processedAt: new Date(),
              },
            });

            this.logger.log(`Published event ${event.eventType} for aggregate ${event.aggregateId} to RabbitMQ`);
          } else {
            this.logger.warn('RabbitMQ channel not available, skipping event processing');
          }
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
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
// import * as amqp from 'amqplib';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  // private connection: amqp.Connection | null = null;
  // private channel: amqp.Channel | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // await this.connectToRabbitMQ();
    this.logger.log('RabbitMQ connection disabled for development');
  }

  async onModuleDestroy() {
    // await this.closeConnection();
  }

  // private async connectToRabbitMQ() {
  //   try {
  //     const rabbitmqUrl = this.configService.get<string>('rabbitmq.url');
  //     const exchange = this.configService.get<string>('rabbitmq.exchange');

  //     this.connection = await amqp.connect(rabbitmqUrl);
  //     this.channel = await this.connection.createChannel();
      
  //     // Declare exchange
  //     await this.channel.assertExchange(exchange, 'topic', { durable: true });
      
  //     this.logger.log('Connected to RabbitMQ');
  //   } catch (error) {
  //     this.logger.error('Failed to connect to RabbitMQ:', error);
  //   }
  // }

  // private async closeConnection() {
  //   if (this.channel) {
  //     await this.channel.close();
  //   }
  //   if (this.connection) {
  //     await this.connection.close();
  //   }
  // }

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

  // @Cron(CronExpression.EVERY_30_SECONDS)
  async processOutboxEvents(): Promise<void> {
    // RabbitMQ processing disabled for development
    this.logger.log('RabbitMQ outbox processing disabled for development');
  }
} 
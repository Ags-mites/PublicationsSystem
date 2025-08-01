import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { OutboxEventEntity } from './outbox.entity';

@Injectable()
export class RabbitMQPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQPublisherService.name);
  private connection?: amqp.Connection;
  private channel?: amqp.ConfirmChannel;
  private readonly exchange: string;
  private readonly exchangeType: string;

  constructor(private readonly configService: ConfigService) {
    this.exchange = this.configService.get<string>('rabbitmq.exchange', 'default-exchange');
    this.exchangeType = this.configService.get<string>('rabbitmq.exchangeType', 'topic');
  }

  async onModuleInit() {
    try {
      await this.connect();
      this.logger.log('✅ RabbitMQ Publisher connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    const rabbitmqUrl = this.configService.get<string>('rabbitmq.url');
    
    this.connection = await amqp.connect(rabbitmqUrl);
    this.channel = await this.connection.createConfirmChannel();
    
    // Set prefetch for better performance
    const prefetch = this.configService.get<number>('rabbitmq.prefetch', 10);
    await this.channel.prefetch(prefetch);
    
    // Declare exchange
    await this.channel.assertExchange(this.exchange, this.exchangeType, {
      durable: true,
    });

    // Handle connection events
    this.connection.on('error', (error) => {
      this.logger.error('RabbitMQ connection error:', error);
    });

    this.connection.on('close', () => {
      this.logger.warn('RabbitMQ connection closed');
    });
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('✅ RabbitMQ Publisher disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  async publishEvent(event: OutboxEventEntity): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const routingKey = this.getRoutingKey(event.eventType);
    const message = Buffer.from(JSON.stringify(event.payloadJson));

    return new Promise((resolve, reject) => {
      this.channel.publish(
        this.exchange,
        routingKey,
        message,
        {
          persistent: true,
          messageId: event.id,
          timestamp: event.createdAt.getTime(),
          headers: {
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            eventType: event.eventType,
            retryCount: event.retryCount,
          },
        },
        (error) => {
          if (error) {
            this.logger.error(`Failed to publish event ${event.id}:`, error);
            reject(error);
          } else {
            this.logger.debug(`Event published: ${event.eventType} for ${event.aggregateId}`);
            resolve();
          }
        },
      );
    });
  }

  private getRoutingKey(eventType: string): string {
    // Map event types to routing keys for topic exchange
    const routingKeyMap: Record<string, string> = {
      'publication.submitted': 'publication.submitted',
      'publication.review.requested': 'publication.review.requested',
      'publication.review.completed': 'publication.review.completed',
      'publication.approved': 'publication.approved',
      'publication.published': 'publication.published',
      'publication.withdrawn': 'publication.withdrawn',
    };

    return routingKeyMap[eventType] || eventType;
  }

  isConnected(): boolean {
    return !!this.connection && !!this.channel;
  }
}
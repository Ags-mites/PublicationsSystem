import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

export interface UserRegisteredEvent {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  timestamp: Date;
}

export interface UserLoginEvent {
  userId: string;
  email: string;
  timestamp: Date;
}

export interface UserLogoutEvent {
  userId: string;
  email: string;
  timestamp: Date;
}

export interface UserProfileUpdatedEvent {
  userId: string;
  email: string;
  changes: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly exchangeName: string;

  constructor(private readonly configService: ConfigService) {
    this.exchangeName = this.configService.get<string>('RABBITMQ_EXCHANGE', 'auth.events');
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672');
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      // Declare exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      
      this.logger.log('RabbitMQ connection established');
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ', error);
    }
  }

  async publishUserRegistered(event: UserRegisteredEvent): Promise<void> {
    await this.publishEvent('user.registered', event);
  }

  async publishUserLogin(event: UserLoginEvent): Promise<void> {
    await this.publishEvent('user.login', event);
  }

  async publishUserLogout(event: UserLogoutEvent): Promise<void> {
    await this.publishEvent('user.logout', event);
  }

  async publishUserProfileUpdated(event: UserProfileUpdatedEvent): Promise<void> {
    await this.publishEvent('user.profile.updated', event);
  }

  private async publishEvent(routingKey: string, event: any): Promise<void> {
    try {
      if (!this.channel) {
        await this.initializeConnection();
      }

      const message = JSON.stringify({
        ...event,
        eventId: crypto.randomUUID(),
        eventType: routingKey,
        version: '1.0',
      });

      await this.channel.publish(
        this.exchangeName,
        routingKey,
        Buffer.from(message),
        {
          persistent: true,
          timestamp: Date.now(),
          messageId: crypto.randomUUID(),
        }
      );

      this.logger.log(`� Published event: ${routingKey}`);
    } catch (error) {
      this.logger.error(`❌ Failed to publish event ${routingKey}`, error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('❌ Error closing RabbitMQ connection', error);
    }
  }
}
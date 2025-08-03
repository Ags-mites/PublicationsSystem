import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';

import { NotificationsController } from './controllers/notifications.controller';
import { PreferencesController } from './controllers/preferences.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { HealthController } from './controllers/health.controller';

import { NotificationProcessor } from './queues/notification.processor';
import { NotificationProcessingService } from './services/notification-processing.service';
import { EmailService } from './services/email.service';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import rabbitmqConfig from './config/rabbitmq.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, rabbitmqConfig, redisConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot({
      ttl: 60000,
      limit: 100,
    }),
    BullModule.forRootAsync({
      useFactory: (configService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
          db: configService.get('redis.db'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    ScheduleModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'notifications_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    PrismaModule,
    EventsModule,
  ],
  controllers: [
    NotificationsController,
    PreferencesController,
    SubscriptionsController,
    HealthController,
  ],
  providers: [
    NotificationProcessor,
    NotificationProcessingService,
    EmailService,
  ],
})
export class AppModule {}
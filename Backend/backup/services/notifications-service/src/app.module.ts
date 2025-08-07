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
import { AdminController } from './controllers/admin.controller';
import { NotificationProcessor } from './queues/notification.processor';
import { NotificationProcessingService } from './services/notification-processing.service';
import { EmailService } from './services/email.service';
import { EventPublisherService } from './services/event-publisher.service';
import { AuthClientService } from './services/auth-client.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import rabbitmqConfig from './config/rabbitmq.config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, rabbitmqConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot({
      ttl: 60000,
      limit: 100,
    }),
    BullModule.forRootAsync({
      useFactory: (configService) => ({
        redis: {
          host: 'localhost',
          port: 6379,
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
          urls: [process.env.RABBITMQ_URL || 'amqp:
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
    AdminController,
  ],
  providers: [
    NotificationProcessor,
    NotificationProcessingService,
    EmailService,
    EventPublisherService,
    AuthClientService,
  ],
})
export class AppModule {}
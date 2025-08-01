import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { DatabaseModule } from './database/database.module';
import { PublicationsModule } from './publications/publications.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AuthorsModule } from './authors/authors.module';
import { EventsModule } from './events/events.module';
import { MetricsModule } from './metrics/metrics.module';
import { HealthModule } from './health/health.module';
import { ConsulModule } from './consul/consul.module';

import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { rabbitmqConfig } from './config/rabbitmq.config';
import { jwtConfig } from './config/jwt.config';
import { consulConfig } from './config/consul.config';

import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        rabbitmqConfig,
        jwtConfig,
        consulConfig,
      ],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, 
        limit: 100, 
      },
    ]),

    ScheduleModule.forRoot(),

    // Core modules
    DatabaseModule,
    EventsModule,

    // Business modules
    PublicationsModule,
    ReviewsModule,
    AuthorsModule,

    // Infrastructure modules
    MetricsModule,
    HealthModule,
    ConsulModule,
  ],
  providers: [LoggingInterceptor],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*');
  }
}
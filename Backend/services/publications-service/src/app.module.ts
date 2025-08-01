import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module'; */
/* 
import { PublicationsModule } from './publications/publications.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AuthorsModule } from './authors/authors.module';
import { MetricsModule } from './metrics/metrics.module';
import { HealthModule } from './health/health.module';
import { ConsulModule } from './consul/consul.module';
*/

import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { rabbitmqConfig } from './config/rabbitmq.config';
import { jwtConfig } from './config/jwt.config';
import { consulConfig } from './config/consul.config';

import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';


@Module({
  imports: [
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

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    ScheduleModule.forRoot(),

    /* DatabaseModule,
    EventsModule, */

  ],
})
export class AppModule { }
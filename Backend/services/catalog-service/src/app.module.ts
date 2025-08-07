import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Reflector } from '@nestjs/core';
import * as Joi from 'joi';

import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';

import { CatalogController } from './controllers/catalog.controller';
import { AuthorsController } from './controllers/authors.controller';
import { HealthController } from './controllers/health.controller';

import { CatalogService } from './services/catalog.service';
import { CatalogSearchService } from './services/catalog-search.service';
import { CatalogAuthorService } from './services/catalog-author.service';
import { MetricsService } from './services/metrics.service';
// import { ConsulService } from './common/consul.service';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import rabbitmqConfig from './config/rabbitmq.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3001),
        API_PREFIX: Joi.string().default('api/v1'),
        DATABASE_URL: Joi.string().required(),
        SERVICE_NAME: Joi.string().default('catalog-service'),
      }),
      load: [appConfig, databaseConfig, rabbitmqConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot({
      ttl: 60000,
      limit: 100,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes default
      max: 100,
    }),
    ClientsModule.register([
      {
        name: 'CATALOG_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'catalog_queue',
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
    CatalogController,
    AuthorsController,
    HealthController,
  ],
  providers: [
    CatalogService,
    CatalogAuthorService,
    CatalogSearchService,
    MetricsService,
    // ConsulService,
  ],
})
export class AppModule {}

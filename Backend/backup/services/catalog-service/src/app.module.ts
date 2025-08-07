import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { AuthorsModule } from './modules/authors/authors.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsService } from './common/metrics.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
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
      load: [appConfig, databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot({
      ttl: 60000,
      limit: 100,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, 
      max: 100,
    }),
    PrismaModule,
    CatalogModule,
    AuthorsModule,
    HealthModule,
  ],
  providers: [
    MetricsService,
  ],
})
export class AppModule {}

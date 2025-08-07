import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { ValidationPipe, Logger } from '@nestjs/common';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { BusinessExceptionFilter } from './common/filters/business-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

const logger = new Logger('Bootstrap');

async function setupSwagger(app: any) {
  const config = new DocumentBuilder()
    .setTitle('Publications Service API')
    .setDescription('Academic Publications Management Microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Publications', 'Publications management endpoints')
    .addTag('Reviews', 'Review system endpoints')
    .addTag('Authors', 'Authors management endpoints')
    .addTag('Metrics', 'Service metrics endpoints')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
    });

    const configService = app.get(ConfigService);
    const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
    const port = parseInt(configService.get<string>('PORT', '3002'), 10);

    // Configuración de seguridad y middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));
    app.use(compression());

    app.enableCors({
      origin: configService.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
      credentials: true,
    })

    app.setGlobalPrefix(apiPrefix);
    app.use(new CorrelationIdMiddleware().use);
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        validateCustomDecorators: true,
        disableErrorMessages: false,
        stopAtFirstError: false,
      }),
    );

    // Global filters
    app.useGlobalFilters(
      new HttpExceptionFilter(),
      new BusinessExceptionFilter(),
    );

    // Global interceptors
    app.useGlobalInterceptors(
      new LoggingInterceptor(),
      new TimeoutInterceptor(),
      new TransformInterceptor(),
    );

    // Configuración de Swagger en desarrollo
    if (process.env.NODE_ENV === 'development') {
      await setupSwagger(app);
    }

    // Iniciar el servidor
    await app.listen(port);
    logger.log(`Publications Service is running on port ${port}`);

    // Manejo de señales de terminación
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      await app.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start Publications Service:', error.message);
    process.exit(1);
  }
}

bootstrap();

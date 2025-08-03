import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { registerWithConsul } from './consul/consul.service';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

async function setupSwagger(app: any) {
  const config = new DocumentBuilder()
    .setTitle('Catalog Service API')
    .setDescription('Public catalog microservice for academic publications')
    .setVersion('1.0')
    .addTag('Catalog', 'Publications catalog endpoints')
    .addTag('Authors', 'Authors management endpoints')
    .addTag('Health', 'Service health and metrics endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = parseInt(configService.get<string>('PORT', '3003'), 10);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // Security middleware
  app.use(helmet());
  app.use(compression());
  
  // CORS configuration
  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: false,
  });

  // Global configuration
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: false,
  }));

  // app.useGlobalFilters(new HttpExceptionFilter()); // DISABLED temporarily
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Global cache interceptor - DISABLED temporarily
  // const cacheManager = app.get('CACHE_MANAGER');
  // const reflector = app.get(Reflector);
  // app.useGlobalInterceptors(new CacheInterceptor(cacheManager, reflector));

  // RabbitMQ microservice setup - DISABLED temporarily
  /*
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
      queue: 'catalog_queue',
      queueOptions: {
        durable: true,
      },
    },
  });
  */

  // Setup Swagger in development
  if (process.env.NODE_ENV === 'development') {
    await setupSwagger(app);
  }

  // Start microservice - DISABLED temporarily
  // await app.startAllMicroservices();
  
  // Start HTTP server
  await app.listen(port);
  
  // Register with Consul
  await registerWithConsul(configService, port, apiPrefix);
  
  console.log(`🚀 Catalog Service running on port ${port}`);
  console.log(`📚 API: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  console.log(`🔍 Health: http://localhost:${port}/${apiPrefix}/health`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start catalog service:', error);
  process.exit(1);
});
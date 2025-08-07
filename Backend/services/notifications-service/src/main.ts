import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { AuthValidationInterceptor } from './interceptors/auth-validation.interceptor';

class SocketIOAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
    });
    return server;
  }
}

async function setupSwagger(app: any) {
  const config = new DocumentBuilder()
    .setTitle('Notifications Service API')
    .setDescription('Multi-channel notification system with real-time capabilities')
    .setVersion('1.0')
    .addTag('Notifications', 'Notification management endpoints')
    .addTag('Notification Preferences', 'User notification preferences')
    .addTag('Notification Subscriptions', 'Event subscription management')
    .addTag('Health', 'Service health and metrics')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = parseInt(configService.get<string>('PORT', '3004'), 10);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for WebSocket connections
  }));
  app.use(compression());
  
  // CORS configuration for both HTTP and WebSocket
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // WebSocket adapter
  app.useWebSocketAdapter(new SocketIOAdapter(app));

  // Global configuration
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: false,
  }));

  // Add shared filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // RabbitMQ microservice setup
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
      queue: 'notifications_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Setup Swagger in development
  if (process.env.NODE_ENV === 'development') {
    await setupSwagger(app);
  }

  // Start microservice
  await app.startAllMicroservices();
  
  // Start HTTP server
  await app.listen(port);
  
  console.log(`🚀 Notifications Service running on port ${port}`);
  console.log(`📧 API: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  console.log(`🔗 WebSocket: ws://localhost:${port}/notifications`);
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
  console.error('Failed to start notifications service:', error);
  process.exit(1);
});
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { corsConfig } from './security/cors.config';
import { ConsulService } from './consul/consul.service';
import * as compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
    });

    const configService = app.get(ConfigService);
    const consulService = app.get(ConsulService);

    // Enable CORS with security configuration
    app.enableCors(corsConfig);

    // Enable compression
    app.use(compression());

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Swagger documentation (only in development)
    if (configService.get<string>('NODE_ENV') !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('API Gateway')
        .setDescription('Enterprise API Gateway for Microservices Architecture')
        .setVersion(configService.get<string>('APP_VERSION', '1.0.0'))
        .addBearerAuth()
        .addServer('http://localhost:3000', 'Development')
        .addServer('https://api.yourcompany.com', 'Production')
        .build();
      
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });
    }

    // Get configuration
    const port = configService.get<number>('PORT', 3000);
    const host = configService.get<string>('HOST', '0.0.0.0');
    const environment = configService.get<string>('NODE_ENV', 'development');

    // Start the server
    await app.listen(port, host);

    // Register with Consul
    try {
      await consulService.registerService(
        'api-gateway',
        port,
        `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/health`,
      );
      logger.log('Successfully registered with Consul');
    } catch (error) {
      logger.warn(`Failed to register with Consul: ${error.message}`);
    }

    // Log startup information
    logger.log(`🚀 API Gateway started successfully`);
    logger.log(`📡 Environment: ${environment}`);
    logger.log(`🌐 Server running at: http://${host}:${port}`);
    logger.log(`❤️  Health check: http://localhost:${port}/health`);
    logger.log(`📊 Metrics: http://localhost:${port}/monitoring/metrics`);
    
    if (environment !== 'production') {
      logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
    }

    logger.log(`🔀 Service routing:`);
    logger.log(`   - Auth Service: /api/auth/* → auth-service`);
    logger.log(`   - Publications Service: /api/publications/* → publications-service`);
    logger.log(`   - Catalog Service: /api/catalog/* → catalog-service`);
    logger.log(`   - Notifications Service: /api/notifications/* → notifications-service`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM received, shutting down gracefully');
      await consulService.deregisterService('api-gateway');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('SIGINT received, shutting down gracefully');
      await consulService.deregisterService('api-gateway');
      await app.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error(`Failed to start API Gateway: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrap().catch(error => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
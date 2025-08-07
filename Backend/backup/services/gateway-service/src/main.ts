import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { corsConfig } from './security/cors.config';
import * as compression from 'compression';
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
    });
    const configService = app.get(ConfigService);
    app.enableCors(corsConfig);
    app.use(compression());
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
    if (configService.get<string>('NODE_ENV') !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('API Gateway')
        .setDescription('Enterprise API Gateway for Microservices Architecture')
        .setVersion(configService.get<string>('APP_VERSION', '1.0.0'))
        .addBearerAuth()
        .addServer('http:
        .addServer('https:
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });
    }
    const port = configService.get<number>('PORT', 3000);
    const host = configService.get<string>('HOST', '0.0.0.0');
    const environment = configService.get<string>('NODE_ENV', 'development');
    await app.listen(port, host);
    logger.log(`🚀 API Gateway started successfully`);
    logger.log(`📡 Environment: ${environment}`);
    logger.log(`🌐 Server running at: http:
    logger.log(`❤️  Health check: http:
    logger.log(`📊 Metrics: http:
    if (environment !== 'production') {
      logger.log(`📚 Swagger docs: http:
    }
    logger.log(`🔀 Service routing:`);

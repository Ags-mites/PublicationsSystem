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
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
async function setupSwagger(app: any) {
  const config = new DocumentBuilder()
    .setTitle('Catalog Service API')
    .setVersion('1.0')
    .addTag('Catalog')
    .addTag('Authors')
    .addTag('Health')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = parseInt(configService.get<string>('PORT', '3003'), 10);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.use(helmet());
  app.use(compression());
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: false,
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  if (process.env.NODE_ENV === 'development') {
    await setupSwagger(app);
  }
  await app.listen(port);
      console.log(`Catalog Service running on port ${port}`);
      console.log(`API: http:
    console.log(`Swagger docs: http:
      console.log(`Health: http:
  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
}
bootstrap().catch((error) => {
  console.error('Failed to start catalog service:', error);
  process.exit(1);
});
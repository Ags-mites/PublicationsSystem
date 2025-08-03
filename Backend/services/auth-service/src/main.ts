import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { registerWithConsul } from './consul/consul.service';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

async function setupSwagger(app: any) {
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('Authentication microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .build(); 

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 3001);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  app.use(helmet());
  app.use(compression());
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  }));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // RabbitMQ microservice setup - DISABLED temporarily
  /*
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
      queue: 'auth_queue',
      queueOptions: {
        durable: true,
      },
    },
  });
  */

  if (process.env.NODE_ENV === 'development') {
   setupSwagger(app);
  }

  // Start microservice - DISABLED temporarily
  // await app.startAllMicroservices();

  await app.listen(port);

  await registerWithConsul(configService, port, apiPrefix); 
  console.log(`� Swagger docs: http://localhost:${port}/docs`);

  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start auth service:', error);
  process.exit(1);
});
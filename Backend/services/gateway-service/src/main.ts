import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for all origins in development
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  // Global prefix for all routes
  app.setGlobalPrefix('api');
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription('Main gateway for microservices ecosystem')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`� API Gateway running on port ${port}`);
  console.log(`� Swagger docs available at: http://localhost:${port}/api/docs`);
  console.log(`� Service routes:`);
  console.log(`   - Auth: http://localhost:${port}/api/auth/*`);
  console.log(`   - Publications: http://localhost:${port}/api/publications/*`);
  console.log(`   - Catalog: http://localhost:${port}/api/catalog/*`);
  console.log(`   - Notifications: http://localhost:${port}/api/notifications/*`);
}

bootstrap();
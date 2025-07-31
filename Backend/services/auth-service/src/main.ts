import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
const consul = require('consul')();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('Authentication and authorization service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  // Register with Consul
  try {
    await consul.agent.service.register({
      name: 'auth-service',
      id: 'auth-service-1',
      address: 'localhost',
      port: parseInt(port.toString()),
      tags: ['auth', 'security'],
      check: {
        http: `http://localhost:${port}/health`,
        interval: '10s'
      }
    });
    console.log('Auth service registered with Consul');
  } catch (error) {
    console.error('Consul registration failed:', error);
  }

  console.log(`Auth Service running on port ${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
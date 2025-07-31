import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import Consul = require('consul');

const consul = new Consul();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  
  const config = new DocumentBuilder()
    .setTitle('Publications Service API')
    .setDescription('Publications management service')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);
  
  // Register with Consul
  try {
    await consul.agent.service.register({
      name: 'publications-service',
      id: 'publications-service-1',
      address: 'localhost',
      port: parseInt(port.toString()),
      tags: ['publications', 'content'],
      check: {
        name: 'publications-service-check',
        http: `http://localhost:${port}/publications/health`,
        interval: '10s',
        timeout: '5s'
      }
    });
    console.log('Publications service registered with Consul');
  } catch (error) {
    console.error('Consul registration failed:', error);
  }

  console.log(`Publications Service running on port ${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
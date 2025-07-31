import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import Consul = require('consul');

const consul = new Consul();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  
  const config = new DocumentBuilder()
    .setTitle('Catalog Service API')
    .setDescription('Publications catalog service')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  
  // Register with Consul
  try {
    await consul.agent.service.register({
      name: 'catalog-service',
      id: 'catalog-service-1',
      address: 'localhost',
      port: parseInt(port.toString()),
      tags: ['catalog', 'public'],
      check: {
        name: 'catalog-service-check',
        http: `http://localhost:${port}/catalog/health`,
        interval: '10s',
        timeout: '5s'
      }
    });
    console.log('Catalog service registered with Consul');
  } catch (error) {
    console.error('Consul registration failed:', error);
  }

  console.log(`Catalog Service running on port ${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
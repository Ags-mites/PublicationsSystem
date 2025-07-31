import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import Consul = require('consul');

const consul = new Consul();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  
  const config = new DocumentBuilder()
    .setTitle('Notifications Service API')
    .setDescription('Notifications management service')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3004;
  await app.listen(port);
  
  // Register with Consul
  try {
    await consul.agent.service.register({
      name: 'notifications-service',
      id: 'notifications-service-1',
      address: 'localhost',
      port: parseInt(port.toString()),
      tags: ['notifications', 'messaging'],
      check: {
        name: 'notifications-service-check',
        http: `http://localhost:${port}/notifications/health`,
        interval: '10s',
        timeout: '5s'
      }
    });
    console.log('Notifications service registered with Consul');
  } catch (error) {
    console.error('Consul registration failed:', error);
  }

  console.log(`Notifications Service running on port ${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
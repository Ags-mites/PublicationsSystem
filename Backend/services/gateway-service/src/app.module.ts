import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ProxyMiddleware } from './middleware/proxy.middleware';

@Module({
  imports: [
    // Rate limiting: 100 requests per minute
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests
    }]),
  ],
  controllers: [GatewayController],
  providers: [GatewayService, ProxyMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply proxy middleware to all service routes
    consumer
      .apply(ProxyMiddleware)
      .forRoutes(
        'auth/*',
        'publications/*', 
        'catalog/*',
        'notifications/*'
      );
  }
}
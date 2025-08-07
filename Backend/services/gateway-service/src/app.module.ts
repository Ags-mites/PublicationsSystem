import { Module, NestModule, MiddlewareConsumer, Logger, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Middleware
import { SecurityMiddleware } from './security/security.middleware';
import { LoggingMiddleware } from './monitoring/logging.middleware';
import { AuthMiddleware } from './auth/auth.middleware';
import { RateLimitMiddleware } from './rate-limit/rate-limit.middleware';

// Services
// import { ConsulService } from './consul/consul.service';
import { JwtService } from './auth/jwt.service';
import { RateLimitService } from './rate-limit/rate-limit.service';
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';
import { ProxyService } from './proxy/proxy.service';
import { HealthService } from './health/health.service';
import { MetricsService } from './monitoring/metrics.service';
import { GatewayService } from './gateway.service';

// Controllers
import { ProxyController } from './proxy/proxy.controller';
import { HealthModule } from './health/health.module';
import { MonitoringController } from './monitoring/monitoring.controller';
import { GatewayController } from './gateway.controller';

// Error handling
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ErrorHandlingInterceptor } from './common/interceptors/error-handling.interceptor';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Throttler module for additional rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [{
          ttl: configService.get<number>('THROTTLE_TTL', 60000),
          limit: configService.get<number>('THROTTLE_LIMIT', 100),
        }],
      }),
    }),

    // Health module
    HealthModule,
  ],
  controllers: [
    MonitoringController,
    GatewayController,
    ProxyController,
  ],
  providers: [
    // Core services
    // ConsulService,
    JwtService,
    RateLimitService,
    CircuitBreakerService,
    ProxyService,
    HealthService,
    MetricsService,
    GatewayService,

    // Middleware as providers
    SecurityMiddleware,
    LoggingMiddleware,
    AuthMiddleware,
    RateLimitMiddleware,

    // Global error handling
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorHandlingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  private readonly logger = new Logger(AppModule.name);

  configure(consumer: MiddlewareConsumer) {
    this.logger.log('Configuring middleware stack');

    // Apply middleware in the correct order
    consumer
      // 1. Security middleware (first line of defense)
      .apply(SecurityMiddleware)
      .forRoutes('*')

      // 2. Logging middleware (log all requests)
      .apply(LoggingMiddleware)
      .forRoutes('*')

      // 3. Rate limiting middleware (before auth to prevent brute force)
      .apply(RateLimitMiddleware)
      .exclude(
        { path: '/health', method: RequestMethod.GET },
        { path: '/health/detailed', method: RequestMethod.GET },
        { path: '/monitoring/metrics', method: RequestMethod.GET },
      )
      .forRoutes('*')

      // 4. Authentication middleware (after rate limiting)
      .apply(AuthMiddleware)
      .exclude(
        // Exclude health check endpoints
        { path: '/health', method: RequestMethod.GET },
        { path: '/health/(.*)', method: RequestMethod.GET },
        
        // Exclude monitoring endpoints (should be protected at network level)
        { path: '/monitoring/(.*)', method: RequestMethod.GET },
        
        // Exclude public API routes (defined in routes.config.ts)
        { path: '/api/auth/login', method: RequestMethod.POST },
        { path: '/api/auth/register', method: RequestMethod.POST },
        { path: '/api/auth/refresh', method: RequestMethod.POST },
        { path: '/api/auth/forgot-password', method: RequestMethod.POST },
        { path: '/api/auth/reset-password', method: RequestMethod.POST },
        { path: '/api/catalog/products', method: RequestMethod.GET },
        { path: '/api/catalog/categories', method: RequestMethod.GET },
        { path: '/api/publications/public', method: RequestMethod.GET },
      )
      .forRoutes('*');

    this.logger.log('Middleware stack configured successfully');
  }
}
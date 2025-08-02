import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Services
import { ConsulRegistrationService } from '../consul/consul-registration.service';
import { StructuredLoggerService } from '../logging/logger.service';
import { MetricsService } from '../metrics/metrics.service';
import { TracingService } from '../tracing/tracing.service';
import { BaseHealthService } from '../health/health.service';
import { ServiceLifecycleManager } from '../lifecycle/service-lifecycle.manager';

// Controllers
import { BaseHealthController } from '../health/health.controller';

// Middleware
import { CorrelationIdMiddleware } from '../tracing/correlation.middleware';

@Module({
  imports: [ConfigModule],
  providers: [
    ConsulRegistrationService,
    StructuredLoggerService,
    MetricsService,
    TracingService,
    BaseHealthService,
    ServiceLifecycleManager,
    CorrelationIdMiddleware,
  ],
  controllers: [BaseHealthController],
  exports: [
    ConsulRegistrationService,
    StructuredLoggerService,
    MetricsService,
    TracingService,
    BaseHealthService,
    ServiceLifecycleManager,
  ],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*');
  }
}
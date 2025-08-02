# Microservices Observability Stack

This comprehensive observability stack provides enterprise-grade monitoring, logging, tracing, and service discovery for microservices architecture.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │ Auth Service    │    │ Publications    │
│                 │    │                 │    │ Service         │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Observability│ │    │ │Observability│ │    │ │Observability│ │
│ │   Module    │ │    │ │   Module    │ │    │ │   Module    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────────────────────────────┐
         │            Observability Stack                │
         │                                               │
         │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │
         │  │ Consul  │ │Prometheus│ │ Grafana │         │
         │  │         │ │         │ │         │         │
         │  └─────────┘ └─────────┘ └─────────┘         │
         │                                               │
         │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │
         │  │  Loki   │ │ Jaeger  │ │AlertMgr │         │
         │  │         │ │         │ │         │         │
         │  └─────────┘ └─────────┘ └─────────┘         │
         └───────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Start the Observability Stack

```bash
# Start all observability services
docker-compose -f docker-compose.observability.yml up -d

# Verify services are running
docker-compose -f docker-compose.observability.yml ps
```

### 2. Access Monitoring Dashboards

- **Consul UI**: http://localhost:8500
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin123)
- **Jaeger**: http://localhost:16686
- **AlertManager**: http://localhost:9093

### 3. Integrate Observability in Your Service

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ObservabilityModule } from './shared/observability/observability.module';

@Module({
  imports: [
    ObservabilityModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 4. Environment Configuration

```env
# Service Configuration
SERVICE_NAME=auth-service
SERVICE_VERSION=1.0.0
SERVICE_HOST=localhost
PORT=3001

# Consul Configuration
CONSUL_HOST=localhost
CONSUL_PORT=8500
CONSUL_ENABLED=true
CONSUL_AUTO_REGISTER=true

# Logging Configuration
LOG_LEVEL=info
LOG_CONSOLE=true
LOG_FILE=true
LOG_FILE_PATH=logs/auth-service.log
LOG_LOKI=true
LOKI_URL=http://localhost:3100

# Tracing Configuration
JAEGER_COLLECTOR_URL=http://localhost:14268
TRACE_LOG_SPANS=false

# Metrics Configuration
METRICS_ENABLED=true
PROMETHEUS_PORT=9090

# Health Check Configuration
HEALTH_CHECK_URL=/health
MEMORY_THRESHOLD_MB=1024

# Lifecycle Configuration
GRACEFUL_SHUTDOWN=true
SHUTDOWN_TIMEOUT=30000
```

## 📊 Features

### Service Discovery
- **Consul Integration**: Automatic service registration and discovery
- **Health Checks**: Comprehensive health monitoring with automatic deregistration
- **Service Mesh**: Ready for Consul Connect integration
- **Load Balancing**: Built-in round-robin load balancing

### Monitoring & Metrics
- **Prometheus Integration**: Auto-discovery of services via Consul
- **Custom Metrics**: Business and technical metrics collection
- **Performance Monitoring**: HTTP request tracking, database monitoring
- **System Metrics**: Memory, CPU, and resource utilization

### Logging
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Log Aggregation**: Centralized logging with Loki
- **Correlation Tracking**: Request tracing across services
- **Log Levels**: Configurable log levels per environment

### Distributed Tracing
- **Request Tracing**: End-to-end request tracking
- **Span Management**: Automatic span creation and management
- **Jaeger Integration**: Export traces to Jaeger for visualization
- **Performance Insights**: Identify bottlenecks and latency issues

### Health Checks
- **Multi-level Health Checks**: Liveness, readiness, and detailed health
- **Dependency Monitoring**: Database, external services, and infrastructure
- **Automated Responses**: Circuit breakers and fallback mechanisms
- **Prometheus Metrics**: Health status exposed as metrics

### Alerting
- **Prometheus Rules**: Pre-configured alerting rules
- **AlertManager**: Smart alert routing and grouping
- **Multiple Channels**: Webhook, email, and custom integrations
- **Alert Inhibition**: Intelligent alert suppression

## 🔧 Usage Examples

### Service Registration

```typescript
import { Injectable } from '@nestjs/common';
import { ConsulRegistrationService } from './shared/consul/consul-registration.service';

@Injectable()
export class AuthService {
  constructor(private consulService: ConsulRegistrationService) {}

  async onModuleInit() {
    // Manual registration (auto-registration is also available)
    await this.consulService.registerService({
      id: 'auth-service-1',
      name: 'auth-service',
      address: 'localhost',
      port: 3001,
      check: {
        http: 'http://localhost:3001/health',
        interval: '30s',
        timeout: '10s',
        deregisterCriticalServiceAfter: '5m'
      },
      tags: ['api', 'auth', 'v1.0'],
      meta: {
        version: '1.0.0',
        environment: 'development'
      }
    });
  }
}
```

### Structured Logging

```typescript
import { Injectable } from '@nestjs/common';
import { StructuredLoggerService } from './shared/logging/logger.service';

@Injectable()
export class AuthService {
  constructor(private logger: StructuredLoggerService) {}

  async loginUser(email: string, traceId: string) {
    this.logger.info('User login attempt', {
      traceId,
      userId: email,
      operation: 'user-login',
      metadata: {
        httpMethod: 'POST',
        httpUrl: '/api/auth/login'
      }
    });

    try {
      // Login logic
      this.logger.logBusinessEvent('user-login-success', {
        email,
        timestamp: new Date()
      }, { traceId });

    } catch (error) {
      this.logger.error('Login failed', error, {
        traceId,
        userId: email,
        operation: 'user-login'
      });
    }
  }
}
```

### Metrics Collection

```typescript
import { Injectable } from '@nestjs/common';
import { MetricsService } from './shared/metrics/metrics.service';

@Injectable()
export class AuthService {
  constructor(private metrics: MetricsService) {}

  async processRequest(method: string, route: string) {
    const startTime = Date.now();
    
    try {
      this.metrics.incrementHttpRequestsInFlight();
      
      // Process request
      const result = await this.handleRequest();
      
      const duration = Date.now() - startTime;
      this.metrics.recordHttpRequest(method, route, 200, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.recordHttpRequest(method, route, 500, duration);
      throw error;
    } finally {
      this.metrics.decrementHttpRequestsInFlight();
    }
  }
}
```

### Health Checks

```typescript
import { Injectable } from '@nestjs/common';
import { BaseHealthService } from './shared/health/health.service';

@Injectable()
export class AuthHealthService extends BaseHealthService {
  constructor(configService: ConfigService) {
    super(configService);
  }

  protected async performDatabaseCheck(): Promise<void> {
    // Check database connectivity
    await this.databaseService.ping();
  }

  protected async getCustomHealthChecks(): Promise<HealthCheck[]> {
    return [
      {
        name: 'user-cache',
        status: await this.checkUserCache() ? 'pass' : 'fail',
        time: new Date().toISOString(),
        output: 'User cache connectivity check'
      }
    ];
  }

  protected async getCustomMetrics(): Promise<Record<string, any>> {
    return {
      activeUsers: await this.getActiveUserCount(),
      cacheHitRate: await this.getCacheHitRate()
    };
  }
}
```

### Distributed Tracing

```typescript
import { Injectable } from '@nestjs/common';
import { TracingService } from './shared/tracing/tracing.service';

@Injectable()
export class AuthService {
  constructor(private tracing: TracingService) {}

  async processLogin(email: string, parentSpan?: Span) {
    return this.tracing.instrumentAsync(
      'user-login',
      async (span) => {
        span.setTag('user.email', email);
        span.setTag('operation', 'authentication');

        // Validate credentials
        const isValid = await this.tracing.instrumentAsync(
          'validate-credentials',
          async (validateSpan) => {
            validateSpan.setTag('validation.type', 'password');
            return this.validateCredentials(email);
          },
          span
        );

        if (isValid) {
          // Generate token
          const token = await this.tracing.instrumentAsync(
            'generate-token',
            async (tokenSpan) => {
              return this.generateJWT(email);
            },
            span
          );

          span.setTag('success', true);
          return { token };
        }

        span.setTag('success', false);
        throw new Error('Invalid credentials');
      },
      parentSpan
    );
  }
}
```

## 📈 Monitoring & Alerting

### Key Metrics to Monitor

1. **Service Level Indicators (SLIs)**
   - Request success rate (>99.9%)
   - Response time (P95 < 100ms)
   - Service availability (>99.95%)

2. **Business Metrics**
   - User registrations
   - Publication creation rate
   - Review completion rate
   - Notification delivery rate

3. **Infrastructure Metrics**
   - Memory usage
   - CPU utilization
   - Database connections
   - Circuit breaker states

### Pre-configured Alerts

1. **Critical Alerts**
   - Service down
   - High error rate (>5%)
   - Memory usage >85%
   - Circuit breaker open

2. **Warning Alerts**
   - High response time (>1s)
   - CPU usage >80%
   - Low disk space
   - Database connection pool exhaustion

## 🔍 Troubleshooting

### Common Issues

1. **Service Not Registering with Consul**
   ```bash
   # Check Consul connectivity
   curl http://localhost:8500/v1/status/leader
   
   # Check service logs
   docker logs <service-container>
   ```

2. **Metrics Not Appearing in Prometheus**
   ```bash
   # Check Prometheus targets
   curl http://localhost:9090/api/v1/targets
   
   # Verify service metrics endpoint
   curl http://localhost:3001/health/metrics/prometheus
   ```

3. **Logs Not Appearing in Loki**
   ```bash
   # Check Promtail status
   docker logs promtail
   
   # Verify log file permissions
   ls -la /var/log/microservices/
   ```

### Performance Tuning

1. **Memory Optimization**
   - Adjust log retention periods
   - Tune metric collection intervals
   - Configure garbage collection

2. **Network Optimization**
   - Use compression for metrics
   - Batch log shipping
   - Optimize health check intervals

## 🎯 Learning Objectives Achieved

1. **Service Discovery Patterns**: Implemented with Consul integration
2. **Health Check Strategies**: Multi-level health monitoring
3. **Metrics Collection**: Prometheus-compatible metrics
4. **Structured Logging**: JSON logging with correlation IDs
5. **Graceful Shutdown**: Proper lifecycle management
6. **Observability**: Complete monitoring stack

## 📚 Additional Resources

- [Consul Documentation](https://developer.hashicorp.com/consul/docs)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Dashboard Gallery](https://grafana.com/grafana/dashboards/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Microservices Observability Patterns](https://microservices.io/patterns/observability/)

This observability stack provides production-ready monitoring and observability for microservices architecture, enabling teams to maintain system reliability, performance, and operational excellence.
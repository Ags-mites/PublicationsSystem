import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsulService } from '../consul/consul.service';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { ProxyService } from '../proxy/proxy.service';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { HealthCheckResult } from '../interfaces/circuit-breaker.interface';
export interface GatewayHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  services: Record<string, HealthCheckResult>;
  components: {
    consul: ComponentHealth;
    circuitBreakers: ComponentHealth;
    rateLimit: ComponentHealth;
    proxy: ComponentHealth;
  };
  overall: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
  };
}
export interface ComponentHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  details?: any;
}
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private startTime = Date.now();
  constructor(
    private consulService: ConsulService,
    private circuitBreakerService: CircuitBreakerService,
    private proxyService: ProxyService,
    private rateLimitService: RateLimitService,
    private configService: ConfigService,
  ) {}
  async getHealthCheck(): Promise<GatewayHealthCheck> {
    try {
      this.logger.debug('Performing comprehensive health check');
      const serviceHealths = this.circuitBreakerService.getAllHealthStatus();
      const consulHealth = await this.checkConsulHealth();
      const circuitBreakerHealth = this.checkCircuitBreakerHealth();
      const rateLimitHealth = this.checkRateLimitHealth();
      const proxyHealth = await this.checkProxyHealth();
      const serviceValues = Object.values(serviceHealths);
      const totalServices = serviceValues.length;
      const healthyServices = serviceValues.filter(s => s.status === 'healthy').length;
      const degradedServices = serviceValues.filter(s => s.status === 'degraded').length;
      const unhealthyServices = serviceValues.filter(s => s.status === 'unhealthy').length;
      const overallStatus = this.calculateOverallStatus([
        consulHealth,
        circuitBreakerHealth,
        rateLimitHealth,
        proxyHealth,
      ], serviceValues);
      const healthCheck: GatewayHealthCheck = {
        status: overallStatus,
        timestamp: new Date(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        version: this.configService.get<string>('APP_VERSION', '1.0.0'),
        services: serviceHealths,
        components: {
          consul: consulHealth,
          circuitBreakers: circuitBreakerHealth,
          rateLimit: rateLimitHealth,
          proxy: proxyHealth,
        },
        overall: {
          totalServices,
          healthyServices,
          degradedServices,
          unhealthyServices,
        },
      };
      this.logger.debug(`Health check completed: ${overallStatus}`);
      return healthCheck;
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        version: this.configService.get<string>('APP_VERSION', '1.0.0'),
        services: {},
        components: {
          consul: { status: 'unhealthy', message: 'Health check failed' },
          circuitBreakers: { status: 'unhealthy', message: 'Health check failed' },
          rateLimit: { status: 'unhealthy', message: 'Health check failed' },
          proxy: { status: 'unhealthy', message: 'Health check failed' },
        },
        overall: {
          totalServices: 0,
          healthyServices: 0,
          degradedServices: 0,
          unhealthyServices: 0,
        },
      };
    }
  }
  async getSimpleHealthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      const healthCheck = await this.getHealthCheck();
      return {
        status: healthCheck.status,
        timestamp: healthCheck.timestamp,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
      };
    }
  }
  private async checkConsulHealth(): Promise<ComponentHealth> {
    try {
      const services = await this.consulService.getAllServices();
      const stats = this.consulService.getCacheStats();
      if (services.length === 0) {
        return {
          status: 'degraded',
          message: 'No services registered in Consul',
          details: stats,
        };
      }
      return {
        status: 'healthy',
        message: `Connected to Consul with ${services.length} services`,
        details: {
          ...stats,
          registeredServices: services,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Consul connection failed: ${error.message}`,
      };
    }
  }
  private checkCircuitBreakerHealth(): ComponentHealth {
    try {
      const stats = this.circuitBreakerService.getAllCircuitBreakerStats();
      const services = Object.keys(stats);
      if (services.length === 0) {
        return {
          status: 'degraded',
          message: 'No circuit breakers configured',
        };
      }
      const openBreakers = services.filter(s => stats[s].state === 'OPEN');
      const halfOpenBreakers = services.filter(s => stats[s].state === 'HALF_OPEN');
      if (openBreakers.length > 0) {
        return {
          status: 'degraded',
          message: `${openBreakers.length} circuit breakers are open`,
          details: {
            totalBreakers: services.length,
            openBreakers,
            halfOpenBreakers,
            stats,
          },
        };
      }
      if (halfOpenBreakers.length > 0) {
        return {
          status: 'degraded',
          message: `${halfOpenBreakers.length} circuit breakers are half-open`,
          details: {
            totalBreakers: services.length,
            halfOpenBreakers,
            stats,
          },
        };
      }
      return {
        status: 'healthy',
        message: `All ${services.length} circuit breakers are closed`,
        details: {
          totalBreakers: services.length,
          stats,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Circuit breaker health check failed: ${error.message}`,
      };
    }
  }
  private checkRateLimitHealth(): ComponentHealth {
    try {
      const stats = this.rateLimitService.getStats();
      return {
        status: 'healthy',
        message: 'Rate limiting is operational',
        details: stats,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Rate limit health check failed: ${error.message}`,
      };
    }
  }
  private async checkProxyHealth(): Promise<ComponentHealth> {
    try {
      const stats = await this.proxyService.getProxyStats();
      return {
        status: 'healthy',
        message: 'Proxy service is operational',
        details: stats,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Proxy health check failed: ${error.message}`,
      };
    }
  }
  private calculateOverallStatus(
    componentHealths: ComponentHealth[],
    serviceHealths: HealthCheckResult[],
  ): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyComponents = componentHealths.filter(c => c.status === 'unhealthy');
    if (unhealthyComponents.length > 0) {
      return 'unhealthy';
    }
    const unhealthyServices = serviceHealths.filter(s => s.status === 'unhealthy');
    if (unhealthyServices.length > 0) {
      return 'unhealthy';
    }
    const degradedComponents = componentHealths.filter(c => c.status === 'degraded');
    const degradedServices = serviceHealths.filter(s => s.status === 'degraded');
    if (degradedComponents.length > 0 || degradedServices.length > 0) {
      return 'degraded';
    }
    return 'healthy';
  }
  async checkServiceHealth(serviceId: string): Promise<HealthCheckResult> {
    const existingHealth = this.circuitBreakerService.getHealthStatus(serviceId);
    if (existingHealth) {
      return existingHealth;
    }
    try {
      const result = await this.proxyService.testServiceConnectivity(serviceId);
      return {
        service: serviceId,
        status: result.status === 'healthy' ? 'healthy' : 'unhealthy',
        responseTime: result.responseTime,
        lastChecked: new Date(),
        details: result,
      };
    } catch (error) {
      return {
        service: serviceId,
        status: 'unhealthy',
        responseTime: -1,
        lastChecked: new Date(),
        details: { error: error.message },
      };
    }
  }
  getMetrics(): any {
    const healthCheck = this.getHealthCheck();
    return {
      gateway_uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
      gateway_health_status: healthCheck.then(h => h.status === 'healthy' ? 1 : 0),
      gateway_total_services: healthCheck.then(h => h.overall.totalServices),
      gateway_healthy_services: healthCheck.then(h => h.overall.healthyServices),
      gateway_degraded_services: healthCheck.then(h => h.overall.degradedServices),
      gateway_unhealthy_services: healthCheck.then(h => h.overall.unhealthyServices),
    };
  }
}
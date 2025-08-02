import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CircuitBreaker from 'opossum';
import { circuitBreakerConfigs } from '../config/circuit-breaker.config';
import { CircuitBreakerConfig, CircuitBreakerState, HealthCheckResult } from '../interfaces/circuit-breaker.interface';

export interface CircuitBreakerStats {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successes: number;
  fallbacks: number;
  rejects: number;
  fires: number;
  opens: number;
  halfOpens: number;
  closes: number;
}

@Injectable()
export class CircuitBreakerService implements OnModuleInit {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private healthStats = new Map<string, HealthCheckResult>();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.initializeCircuitBreakers();
    // Start periodic health checks
    setInterval(() => this.updateHealthStats(), 30000); // Every 30 seconds
  }

  private initializeCircuitBreakers(): void {
    Object.entries(circuitBreakerConfigs).forEach(([serviceId, config]) => {
      const options = {
        timeout: config.timeout,
        errorThresholdPercentage: (config.failureThreshold / 10) * 100, // Convert to percentage
        resetTimeout: 30000, // 30 seconds
        rollingCountTimeout: 10000, // 10 seconds
        rollingCountBuckets: 10,
        name: serviceId,
        group: 'gateway-services',
      };

      const breaker = new CircuitBreaker(this.createServiceCall(serviceId), options);

      // Event listeners for monitoring
      breaker.on('open', () => {
        this.logger.warn(`Circuit breaker OPEN for service: ${serviceId}`);
      });

      breaker.on('halfOpen', () => {
        this.logger.log(`Circuit breaker HALF-OPEN for service: ${serviceId}`);
      });

      breaker.on('close', () => {
        this.logger.log(`Circuit breaker CLOSED for service: ${serviceId}`);
      });

      breaker.on('failure', (error) => {
        this.logger.error(`Circuit breaker failure for ${serviceId}: ${error.message}`);
      });

      breaker.fallback((error) => {
        this.logger.warn(`Fallback triggered for ${serviceId}: ${error.message}`);
        return this.createFallbackResponse(serviceId, error);
      });

      this.circuitBreakers.set(serviceId, breaker);
      this.logger.log(`Circuit breaker initialized for service: ${serviceId}`);
    });
  }

  async executeWithCircuitBreaker<T>(
    serviceId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const breaker = this.circuitBreakers.get(serviceId);
    
    if (!breaker) {
      this.logger.warn(`No circuit breaker found for service: ${serviceId}, executing directly`);
      return operation();
    }

    try {
      const result = await breaker.fire(operation);
      this.updateServiceHealth(serviceId, true);
      return result;
    } catch (error) {
      this.updateServiceHealth(serviceId, false, error.message);
      throw error;
    }
  }

  getCircuitBreakerState(serviceId: string): CircuitBreakerState | null {
    const breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) return null;

    const stats = breaker.stats;
    return {
      state: breaker.opened ? 'OPEN' : (breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED'),
      failureCount: stats.failures,
      successCount: stats.successes,
      lastFailureTime: stats.failures > 0 ? new Date() : undefined,
      lastSuccessTime: stats.successes > 0 ? new Date() : undefined,
    };
  }

  getCircuitBreakerStats(serviceId: string): CircuitBreakerStats | null {
    const breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) return null;

    const stats = breaker.stats;
    return {
      state: breaker.opened ? 'OPEN' : (breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED'),
      failures: stats.failures,
      successes: stats.successes,
      fallbacks: stats.fallbacks,
      rejects: stats.rejects,
      fires: stats.fires,
      opens: stats.opens,
      halfOpens: stats.halfOpens,
      closes: stats.closes,
    };
  }

  getAllCircuitBreakerStats(): Record<string, CircuitBreakerStats> {
    const allStats: Record<string, CircuitBreakerStats> = {};
    
    this.circuitBreakers.forEach((breaker, serviceId) => {
      const stats = this.getCircuitBreakerStats(serviceId);
      if (stats) {
        allStats[serviceId] = stats;
      }
    });

    return allStats;
  }

  getHealthStatus(serviceId: string): HealthCheckResult | null {
    return this.healthStats.get(serviceId) || null;
  }

  getAllHealthStatus(): Record<string, HealthCheckResult> {
    const allHealth: Record<string, HealthCheckResult> = {};
    
    this.healthStats.forEach((health, serviceId) => {
      allHealth[serviceId] = health;
    });

    return allHealth;
  }

  private createServiceCall(serviceId: string) {
    return async (operation: () => Promise<any>) => {
      if (typeof operation === 'function') {
        return operation();
      }
      throw new Error('Invalid operation provided to circuit breaker');
    };
  }

  private createFallbackResponse(serviceId: string, error: any): any {
    const config = circuitBreakerConfigs[serviceId];
    
    if (config?.fallbackResponse) {
      return {
        ...config.fallbackResponse,
        timestamp: new Date().toISOString(),
        service: serviceId,
        circuitBreakerTriggered: true,
        originalError: error.message,
      };
    }

    // Default fallback response
    return {
      statusCode: 503,
      message: `Service ${serviceId} is temporarily unavailable`,
      timestamp: new Date().toISOString(),
      service: serviceId,
      circuitBreakerTriggered: true,
      originalError: error.message,
    };
  }

  private updateServiceHealth(serviceId: string, success: boolean, errorDetails?: string): void {
    const now = new Date();
    const existingHealth = this.healthStats.get(serviceId);
    
    const circuitState = this.getCircuitBreakerState(serviceId);
    
    const health: HealthCheckResult = {
      service: serviceId,
      status: success ? 'healthy' : 'unhealthy',
      responseTime: existingHealth?.responseTime || 0,
      lastChecked: now,
      details: errorDetails ? { error: errorDetails } : undefined,
      circuitState: circuitState || undefined,
    };

    // Determine overall status based on circuit breaker state
    if (circuitState) {
      if (circuitState.state === 'OPEN') {
        health.status = 'unhealthy';
      } else if (circuitState.state === 'HALF_OPEN') {
        health.status = 'degraded';
      }
    }

    this.healthStats.set(serviceId, health);
  }

  private async updateHealthStats(): Promise<void> {
    this.circuitBreakers.forEach((breaker, serviceId) => {
      const stats = breaker.stats;
      const circuitState = this.getCircuitBreakerState(serviceId);
      
      // Calculate health status based on recent performance
      const totalRequests = stats.fires;
      const failureRate = totalRequests > 0 ? (stats.failures / totalRequests) : 0;
      
      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      
      if (circuitState?.state === 'OPEN') {
        status = 'unhealthy';
      } else if (circuitState?.state === 'HALF_OPEN' || failureRate > 0.1) {
        status = 'degraded';
      }

      const health: HealthCheckResult = {
        service: serviceId,
        status,
        responseTime: 0, // Would be calculated from actual requests
        lastChecked: new Date(),
        details: {
          failureRate: Math.round(failureRate * 100),
          totalRequests: totalRequests,
        },
        circuitState: circuitState || undefined,
      };

      this.healthStats.set(serviceId, health);
    });
  }

  // Administrative methods
  async resetCircuitBreaker(serviceId: string): Promise<boolean> {
    const breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) return false;

    breaker.close();
    this.logger.log(`Circuit breaker reset for service: ${serviceId}`);
    return true;
  }

  async enableCircuitBreaker(serviceId: string): Promise<boolean> {
    const breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) return false;

    breaker.enable();
    this.logger.log(`Circuit breaker enabled for service: ${serviceId}`);
    return true;
  }

  async disableCircuitBreaker(serviceId: string): Promise<boolean> {
    const breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) return false;

    breaker.disable();
    this.logger.log(`Circuit breaker disabled for service: ${serviceId}`);
    return true;
  }
}
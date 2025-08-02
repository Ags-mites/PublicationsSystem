import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const consul = require('consul');
import { ServiceInstance } from '../interfaces/route.interface';

@Injectable()
export class ConsulService implements OnModuleInit {
  private readonly logger = new Logger(ConsulService.name);
  private readonly consul: any;
  private serviceCache = new Map<string, ServiceInstance[]>();
  private lastCacheUpdate = new Map<string, number>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor(private configService: ConfigService) {
    this.consul = new consul({
      host: this.configService.get<string>('CONSUL_HOST', 'localhost'),
      port: this.configService.get<number>('CONSUL_PORT', 8500),
    });
  }

  async onModuleInit() {
    this.logger.log('Consul service initialized');
    // Start periodic health checks
    setInterval(() => this.refreshServiceCache(), 15000); // Refresh every 15 seconds
  }

  async getHealthyServices(serviceId: string): Promise<ServiceInstance[]> {
    const cacheKey = serviceId;
    const lastUpdate = this.lastCacheUpdate.get(cacheKey) || 0;
    const now = Date.now();

    if (now - lastUpdate < this.CACHE_TTL && this.serviceCache.has(cacheKey)) {
      return this.serviceCache.get(cacheKey)!;
    }

    try {
      const services = await this.consul.health.service({
        service: serviceId,
        passing: true,
      });

      const instances: ServiceInstance[] = services[1].map((service: any) => ({
        serviceId: service.Service.Service,
        host: service.Service.Address || service.Node.Address,
        port: service.Service.Port,
        health: this.mapHealthStatus(service.Checks),
        lastChecked: new Date(),
        tags: service.Service.Tags,
        meta: service.Service.Meta,
      }));

      // Filter only healthy instances
      const healthyInstances = instances.filter(instance => instance.health === 'passing');

      this.serviceCache.set(cacheKey, healthyInstances);
      this.lastCacheUpdate.set(cacheKey, now);

      this.logger.debug(`Found ${healthyInstances.length} healthy instances for ${serviceId}`);
      return healthyInstances;

    } catch (error) {
      this.logger.error(`Failed to get healthy services for ${serviceId}: ${error.message}`);
      
      // Return cached data if available
      if (this.serviceCache.has(cacheKey)) {
        this.logger.warn(`Using cached data for ${serviceId}`);
        return this.serviceCache.get(cacheKey)!;
      }
      
      return [];
    }
  }

  async getServiceUrl(serviceId: string): Promise<string | null> {
    const healthyServices = await this.getHealthyServices(serviceId);
    
    if (healthyServices.length === 0) {
      this.logger.warn(`No healthy instances found for service: ${serviceId}`);
      return null;
    }

    // Simple round-robin load balancing
    const instance = this.selectInstance(healthyServices, serviceId);
    const url = `http://${instance.host}:${instance.port}`;
    
    this.logger.debug(`Selected instance for ${serviceId}: ${url}`);
    return url;
  }

  async getAllServices(): Promise<string[]> {
    try {
      const services = await this.consul.catalog.service.list();
      return Object.keys(services[1]);
    } catch (error) {
      this.logger.error(`Failed to get all services: ${error.message}`);
      return [];
    }
  }

  async registerService(
    serviceName: string,
    port: number,
    healthCheckUrl: string,
  ): Promise<void> {
    try {
      await this.consul.agent.service.register({
        name: serviceName,
        id: `${serviceName}-${process.pid}`,
        address: 'localhost',
        port,
        tags: ['gateway', 'proxy', 'api'],
        check: {
          name: `${serviceName}-health-check`,
          http: healthCheckUrl,
          interval: '10s',
          timeout: '5s',
          deregistercriticalserviceafter: '30s',
        },
      });

      this.logger.log(`Service ${serviceName} registered with Consul on port ${port}`);
    } catch (error) {
      this.logger.error(`Failed to register service with Consul: ${error.message}`);
      throw error;
    }
  }

  async deregisterService(serviceName: string): Promise<void> {
    try {
      await this.consul.agent.service.deregister(`${serviceName}-${process.pid}`);
      this.logger.log(`Service ${serviceName} deregistered from Consul`);
    } catch (error) {
      this.logger.error(`Failed to deregister service from Consul: ${error.message}`);
    }
  }

  private selectInstance(instances: ServiceInstance[], serviceId: string): ServiceInstance {
    // Simple round-robin based on current time
    const index = Math.floor(Date.now() / 1000) % instances.length;
    return instances[index];
  }

  private mapHealthStatus(checks: any[]): 'passing' | 'warning' | 'critical' {
    if (!checks || checks.length === 0) return 'critical';
    
    const statuses = checks.map(check => check.Status);
    
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'passing';
  }

  private async refreshServiceCache(): Promise<void> {
    const serviceIds = Array.from(this.serviceCache.keys());
    
    for (const serviceId of serviceIds) {
      try {
        await this.getHealthyServices(serviceId);
      } catch (error) {
        this.logger.debug(`Failed to refresh cache for ${serviceId}: ${error.message}`);
      }
    }
  }

  // Health check methods for monitoring
  getCacheStats(): any {
    const stats: any = {};
    
    this.serviceCache.forEach((instances, serviceId) => {
      stats[serviceId] = {
        instanceCount: instances.length,
        lastUpdate: this.lastCacheUpdate.get(serviceId),
        healthy: instances.filter(i => i.health === 'passing').length,
      };
    });

    return {
      services: stats,
      totalCachedServices: this.serviceCache.size,
      cacheHitRatio: this.calculateCacheHitRatio(),
    };
  }

  private calculateCacheHitRatio(): number {
    // Simple implementation - in production, you'd track actual cache hits/misses
    return 0.85; // 85% cache hit ratio placeholder
  }
}
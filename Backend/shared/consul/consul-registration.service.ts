import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const consul = require('consul');

export interface ConsulServiceConfig {
  id: string;
  name: string;
  address: string;
  port: number;
  check: {
    http: string;
    interval: string;
    timeout: string;
    deregisterCriticalServiceAfter: string;
  };
  tags: string[];
  meta: {
    version: string;
    environment: string;
    startedAt?: string;
  };
}

export interface ServiceHealth {
  status: 'passing' | 'warning' | 'critical';
  output: string;
  notes?: string;
}

@Injectable()
export class ConsulRegistrationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConsulRegistrationService.name);
  private readonly consul: any;
  private serviceConfig: ConsulServiceConfig | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(private configService: ConfigService) {
    this.consul = consul({
      host: this.configService.get<string>('CONSUL_HOST', 'localhost'),
      port: this.configService.get<number>('CONSUL_PORT', 8500),
      promisify: true,
    });
  }

  async onModuleInit() {
    // Auto-register if configuration is available
    const autoRegister = this.configService.get<boolean>('CONSUL_AUTO_REGISTER', true);
    if (autoRegister) {
      await this.autoRegisterService();
    }
    
    // Set up periodic health checks
    this.setupPeriodicHealthCheck();
  }

  async onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.serviceConfig) {
      await this.deregisterService(this.serviceConfig.id);
    }
  }

  async registerService(config: ConsulServiceConfig): Promise<void> {
    try {
      this.logger.log(`Registering service: ${config.name} (${config.id})`);

      // Add startup timestamp
      config.meta.startedAt = new Date().toISOString();

      const consulConfig = {
        name: config.name,
        id: config.id,
        address: config.address,
        port: config.port,
        tags: config.tags,
        meta: config.meta,
        check: {
          name: `${config.name}-health-check`,
          http: config.check.http,
          interval: config.check.interval,
          timeout: config.check.timeout,
          deregistercriticalserviceafter: config.check.deregisterCriticalServiceAfter,
          status: 'passing',
        },
      };

      await this.consul.agent.service.register(consulConfig);
      this.serviceConfig = config;

      this.logger.log(`Service ${config.name} registered successfully with Consul`);
      this.logger.debug(`Service details: ${JSON.stringify(consulConfig, null, 2)}`);

    } catch (error) {
      this.logger.error(`Failed to register service with Consul: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deregisterService(serviceId: string): Promise<void> {
    try {
      this.logger.log(`Deregistering service: ${serviceId}`);
      await this.consul.agent.service.deregister(serviceId);
      this.logger.log(`Service ${serviceId} deregistered from Consul`);
      this.serviceConfig = null;
    } catch (error) {
      this.logger.error(`Failed to deregister service from Consul: ${error.message}`, error.stack);
    }
  }

  async updateServiceHealth(serviceId: string, health: ServiceHealth): Promise<void> {
    try {
      const checkId = `service:${serviceId}`;
      
      switch (health.status) {
        case 'passing':
          await this.consul.agent.check.pass(checkId, health.output);
          break;
        case 'warning':
          await this.consul.agent.check.warn(checkId, health.output);
          break;
        case 'critical':
          await this.consul.agent.check.fail(checkId, health.output);
          break;
      }

      this.logger.debug(`Updated health status for ${serviceId}: ${health.status}`);
    } catch (error) {
      this.logger.error(`Failed to update service health: ${error.message}`, error.stack);
    }
  }

  async getService(serviceName: string): Promise<any[]> {
    try {
      const result = await this.consul.health.service(serviceName);
      return result || [];
    } catch (error) {
      this.logger.error(`Failed to get service ${serviceName}: ${error.message}`);
      return [];
    }
  }

  async getAllServices(): Promise<Record<string, string[]>> {
    try {
      const result = await this.consul.catalog.service.list();
      return result || {};
    } catch (error) {
      this.logger.error(`Failed to get all services: ${error.message}`);
      return {};
    }
  }

  async getHealthyServices(serviceName: string): Promise<any[]> {
    try {
      const result = await this.consul.health.service({
        service: serviceName,
        passing: true,
      });
      return result || [];
    } catch (error) {
      this.logger.error(`Failed to get healthy services for ${serviceName}: ${error.message}`);
      return [];
    }
  }

  async discoverService(serviceName: string): Promise<string | null> {
    try {
      const services = await this.getHealthyServices(serviceName);
      
      if (services.length === 0) {
        this.logger.warn(`No healthy instances found for service: ${serviceName}`);
        return null;
      }

      // Simple round-robin selection
      const randomIndex = Math.floor(Math.random() * services.length);
      const selectedService = services[randomIndex];
      
      const serviceInfo = selectedService.Service;
      const address = serviceInfo.Address || selectedService.Node.Address;
      const port = serviceInfo.Port;
      
      const serviceUrl = `http://${address}:${port}`;
      this.logger.debug(`Discovered service ${serviceName} at: ${serviceUrl}`);
      
      return serviceUrl;
    } catch (error) {
      this.logger.error(`Failed to discover service ${serviceName}: ${error.message}`);
      return null;
    }
  }

  async getConsulStatus(): Promise<any> {
    try {
      const leader = await this.consul.status.leader();
      const peers = await this.consul.status.peers();
      const members = await this.consul.agent.members();
      
      return {
        leader,
        peers,
        members: members.length,
        healthy: true,
      };
    } catch (error) {
      this.logger.error(`Failed to get Consul status: ${error.message}`);
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  private async autoRegisterService(): Promise<void> {
    const serviceName = this.configService.get<string>('SERVICE_NAME');
    const servicePort = this.configService.get<number>('PORT', 3000);
    const serviceHost = this.configService.get<string>('SERVICE_HOST', 'localhost');
    const serviceVersion = this.configService.get<string>('SERVICE_VERSION', '1.0.0');
    const environment = this.configService.get<string>('NODE_ENV', 'development');

    if (!serviceName) {
      this.logger.warn('SERVICE_NAME not configured, skipping auto-registration');
      return;
    }

    const hostname = process.env.HOSTNAME || 'local';
    const serviceId = `${serviceName}-${hostname}-${servicePort}`;

    const config: ConsulServiceConfig = {
      id: serviceId,
      name: serviceName,
      address: serviceHost,
      port: servicePort,
      check: {
        http: `http://${serviceHost}:${servicePort}/health`,
        interval: '30s',
        timeout: '10s',
        deregisterCriticalServiceAfter: '5m',
      },
      tags: [
        'api',
        serviceName,
        `v${serviceVersion}`,
        environment,
        'auto-registered',
      ],
      meta: {
        version: serviceVersion,
        environment,
      },
    };

    await this.registerService(config);
  }

  private setupPeriodicHealthCheck(): void {
    const interval = this.configService.get<number>('CONSUL_HEALTH_CHECK_INTERVAL', 60000); // 1 minute
    
    this.healthCheckInterval = setInterval(async () => {
      if (this.serviceConfig) {
        try {
          // Perform a simple health check
          const status = await this.performSelfHealthCheck();
          await this.updateServiceHealth(this.serviceConfig.id, {
            status: status.healthy ? 'passing' : 'critical',
            output: status.message,
          });
        } catch (error) {
          this.logger.error('Failed to perform periodic health check', error);
        }
      }
    }, interval);
  }

  private async performSelfHealthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      // Check basic application health
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Simple checks - can be extended based on service requirements
      const memoryThreshold = 1024 * 1024 * 1024; // 1GB
      const isHealthy = memoryUsage.rss < memoryThreshold;
      
      return {
        healthy: isHealthy,
        message: `Uptime: ${uptime}s, Memory: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error.message}`,
      };
    }
  }

  // Utility methods for service mesh patterns
  async enableMaintenanceMode(serviceId: string, reason: string): Promise<void> {
    try {
      await this.consul.agent.service.maintenance(serviceId, true, reason);
      this.logger.log(`Enabled maintenance mode for ${serviceId}: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to enable maintenance mode: ${error.message}`);
    }
  }

  async disableMaintenanceMode(serviceId: string): Promise<void> {
    try {
      await this.consul.agent.service.maintenance(serviceId, false);
      this.logger.log(`Disabled maintenance mode for ${serviceId}`);
    } catch (error) {
      this.logger.error(`Failed to disable maintenance mode: ${error.message}`);
    }
  }

  async getServiceMetadata(serviceName: string): Promise<any> {
    try {
      const services = await this.getHealthyServices(serviceName);
      return services.map(service => ({
        id: service.Service.ID,
        address: service.Service.Address,
        port: service.Service.Port,
        tags: service.Service.Tags,
        meta: service.Service.Meta,
        health: service.Checks.map(check => ({
          status: check.Status,
          output: check.Output,
          name: check.Name,
        })),
      }));
    } catch (error) {
      this.logger.error(`Failed to get service metadata: ${error.message}`);
      return [];
    }
  }
}
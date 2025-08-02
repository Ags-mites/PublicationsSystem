import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const consul = require('consul');

@Injectable()
export class ConsulService {
  private readonly logger = new Logger(ConsulService.name);
  private readonly consul: any;

  constructor(private configService: ConfigService) {
    this.consul = new consul({
      host: this.configService.get<string>('CONSUL_HOST', 'localhost'),
      port: this.configService.get<number>('CONSUL_PORT', 8500),
    });
  }

  async registerService(
    serviceName: string,
    port: number,
    apiPrefix: string,
  ): Promise<void> {
    try {
      await this.consul.agent.service.register({
        name: serviceName,
        id: `${serviceName}-${process.pid}`,
        address: 'localhost',
        port,
        tags: ['catalog', 'public', 'search'],
        check: {
          name: `${serviceName}-health-check`,
          http: `http://localhost:${port}/${apiPrefix}/health`,
          interval: '10s',
          timeout: '5s',
          deregistercriticalserviceafter: '30s',
        },
      });

      this.logger.log(`Service ${serviceName} registered with Consul on port ${port}`);
    } catch (error) {
      this.logger.error('Failed to register service with Consul:', error);
      throw error;
    }
  }

  async deregisterService(serviceName: string): Promise<void> {
    try {
      await this.consul.agent.service.deregister(`${serviceName}-${process.pid}`);
      this.logger.log(`Service ${serviceName} deregistered from Consul`);
    } catch (error) {
      this.logger.error('Failed to deregister service from Consul:', error);
    }
  }
}

export async function registerWithConsul(
  configService: ConfigService,
  port: number,
  apiPrefix: string,
): Promise<void> {
  const consulService = new ConsulService(configService);
  await consulService.registerService('catalog-service', port, apiPrefix);
}
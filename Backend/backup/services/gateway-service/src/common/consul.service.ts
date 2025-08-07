import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Consul from 'consul';
@Injectable()
export class ConsulService implements OnModuleInit, OnModuleDestroy {
  private consul: Consul;
  private readonly serviceId: string;
  constructor() {
    this.serviceId = (process.env.SERVICE_NAME || 'gateway-service') + '-' + Math.random().toString(36).substring(7);
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'localhost',
      port: parseInt(process.env.CONSUL_PORT || '8500', 10),
    });
  }
  async onModuleInit() {
    try {
      const serviceName = process.env.SERVICE_NAME || 'gateway-service';
      const serviceHost = process.env.SERVICE_HOST || 'localhost';
      const servicePort = parseInt(process.env.PORT || '8080', 10);
      await this.consul.agent.service.register({
        id: this.serviceId,
        name: serviceName,
        address: serviceHost,
        port: servicePort,
        check: {
          name: `${serviceName}-health`,
          http: `http:
          interval: '10s',
          timeout: '5s',
        },
      });
      console.log(`[CONSUL] ${this.serviceId} registered successfully`);
    } catch (error) {
      console.error(`[CONSUL] Failed to register service: ${error.message}`);
    }
  }
  async onModuleDestroy() {
    try {
      await this.consul.agent.service.deregister(this.serviceId);
      console.log(`[CONSUL] ${this.serviceId} deregistered successfully`);
    } catch (error) {
      console.error(`[CONSUL] Failed to deregister service: ${error.message}`);
    }
  }
  async discoverService(serviceName: string): Promise<{ address: string; port: number } | null> {
    try {
      const services = await this.consul.catalog.service.nodes(serviceName);
      if (services && services.length > 0) {
        const service = services[0];
        return {
          address: service.Address,
          port: service.ServicePort,
        };
      }
      return null;
    } catch (error) {
      console.error(`[CONSUL] Failed to discover service ${serviceName}: ${error.message}`);
      return null;
    }
  }
  async getServiceUrl(serviceName: string, path: string = ''): Promise<string | null> {
    const service = await this.discoverService(serviceName);
    if (service) {
      return `http:
    }
    return null;
  }
} 
import { Injectable } from '@nestjs/common';
import { ConsulService } from './consul.service';
@Injectable()
export class ConsulDiscoveryService {
  constructor(private readonly consulService: ConsulService) {}
  async getPublicationsServiceUrl(): Promise<string | null> {
    return this.consulService.getServiceUrl('publications-service', '/api/v1/publications');
  }
  async getCatalogServiceUrl(): Promise<string | null> {
    return this.consulService.getServiceUrl('catalog-service', '/api/v1/catalog');
  }
  async getNotificationsServiceUrl(): Promise<string | null> {
    return this.consulService.getServiceUrl('notifications-service', '/api/v1/notifications');
  }
  async discoverService(serviceName: string): Promise<{ address: string; port: number } | null> {
    return this.consulService.discoverService(serviceName);
  }
  async callService(serviceName: string, path: string, options: RequestInit = {}): Promise<Response> {
    const serviceUrl = await this.consulService.getServiceUrl(serviceName, path);
    if (!serviceUrl) {
      throw new Error(`Service ${serviceName} not found or not healthy`);
    }
    return fetch(serviceUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }
} 
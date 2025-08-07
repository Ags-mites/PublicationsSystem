import { Injectable } from '@nestjs/common';
import { ConsulService } from './consul.service';

@Injectable()
export class ConsulDiscoveryService {
  constructor(private readonly consulService: ConsulService) {}

  // Ejemplo: Obtener URL del servicio de publicaciones
  async getPublicationsServiceUrl(): Promise<string | null> {
    return this.consulService.getServiceUrl('publications-service', '/api/v1/publications');
  }

  // Ejemplo: Obtener URL del servicio de catálogo
  async getCatalogServiceUrl(): Promise<string | null> {
    return this.consulService.getServiceUrl('catalog-service', '/api/v1/catalog');
  }

  // Ejemplo: Obtener URL del servicio de notificaciones
  async getNotificationsServiceUrl(): Promise<string | null> {
    return this.consulService.getServiceUrl('notifications-service', '/api/v1/notifications');
  }

  // Ejemplo: Descubrir un servicio específico
  async discoverService(serviceName: string): Promise<{ address: string; port: number } | null> {
    return this.consulService.discoverService(serviceName);
  }

  // Ejemplo: Hacer una llamada HTTP a otro servicio usando Consul
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
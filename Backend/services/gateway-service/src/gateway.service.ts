import { Injectable } from '@nestjs/common';
import Consul = require('consul');

const consul = new Consul();

@Injectable()
export class GatewayService {
  async getGatewayInfo(): Promise<object> {
    const services = await this.getDiscoveredServices();
    return {
      name: 'API Gateway',
      version: '1.0.0',
      port: process.env.PORT || 3000,
      timestamp: new Date(),
      routes: {
        auth: '/api/auth/*',
        publications: '/api/publications/*',
        catalog: '/api/catalog/*',
        notifications: '/api/notifications/*'
      },
      features: [
        'Service Discovery via Consul',
        'Rate Limiting (100 req/min)',
        'CORS Enabled',
        'Circuit Breaker Pattern',
        'Dynamic Routing'
      ],
      discoveredServices: services
    };
  }

  getHealth(): object {
    return {
      status: 'healthy',
      service: 'api-gateway',
      uptime: process.uptime(),
      timestamp: new Date(),
      memory: process.memoryUsage()
    };
  }

  async getDiscoveredServices(): Promise<object> {
    try {
      const services = await consul.catalog.service.list();
      const serviceDetails = {};
      for (const serviceName of Object.keys(services)) {
        if (serviceName !== 'consul') {
          try {
            const instances = await consul.health.service(serviceName);
            serviceDetails[serviceName] = instances
              .filter(instance => instance.Checks.every(check => check.Status === 'passing'))
              .map(instance => ({
                id: instance.Service.ID,
                address: instance.Service.Address,
                port: instance.Service.Port,
                tags: instance.Service.Tags
              }));
          } catch (error) {
            console.error(`Error fetching ${serviceName}:`, error.message);
            serviceDetails[serviceName] = [];
          }
        }
      }
      return {
        totalServices: Object.keys(serviceDetails).length,
        services: serviceDetails,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error connecting to Consul:', error.message);
      return {
        error: 'Could not connect to service discovery',
        fallbackServices: {
          'auth-service': [{ address: 'localhost', port: 3001 }],
          'publications-service': [{ address: 'localhost', port: 3002 }],
          'catalog-service': [{ address: 'localhost', port: 3003 }],
          'notifications-service': [{ address: 'localhost', port: 3004 }]
        }
      };
    }
  }
} 
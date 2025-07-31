import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import Consul = require('consul');

const consul = new Consul();

interface ServiceConfig {
  service: string;
  fallback: string;
}

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private serviceRoutes = {
    '/api/auth': { service: 'auth-service', fallback: 'http://localhost:3001' },
    '/api/publications': { service: 'publications-service', fallback: 'http://localhost:3002' },
    '/api/catalog': { service: 'catalog-service', fallback: 'http://localhost:3003' },
    '/api/notifications': { service: 'notifications-service', fallback: 'http://localhost:3004' }
  };

  async use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;
    let targetService: ServiceConfig | null = null;

    // Find matching service route
    for (const [route, config] of Object.entries(this.serviceRoutes)) {
      if (path.startsWith(route)) {
        targetService = config;
        break;
      }
    }

    if (!targetService) {
      return next();
    }

    // Type assertion since we've already checked targetService is not null
    const serviceConfig = targetService as ServiceConfig;

    try {
      // Try to discover service via Consul
      const instances = await consul.health.service(serviceConfig.service);
      const healthyInstances = instances.filter(instance => 
        instance.Checks.every(check => check.Status === 'passing')
      );

      let target = serviceConfig.fallback;
      
      if (healthyInstances.length > 0) {
        // Use discovered service
        const instance = healthyInstances[0]; // Simple round-robin could be implemented
        target = `http://${instance.Service.Address}:${instance.Service.Port}`;
      }

      // Create proxy middleware with circuit breaker logic
      const proxy = createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: (path) => {
          // Remove /api prefix for downstream services
          for (const route of Object.keys(this.serviceRoutes)) {
            if (path.startsWith(route)) {
              return path.replace('/api', '');
            }
          }
          return path;
        },
        onError: (err, req, res) => {
          console.error(`Proxy error for ${serviceConfig.service}:`, err.message);
          res.status(503).json({
            error: 'Service temporarily unavailable',
            service: serviceConfig.service,
            timestamp: new Date()
          });
        },
        timeout: 5000, // 5 second timeout
        proxyTimeout: 5000,
      });

      return proxy(req, res, next);
      
    } catch (error) {
      console.error(`Service discovery failed for ${serviceConfig.service}:`, error.message);
      
      // Fallback to direct connection
      const proxy = createProxyMiddleware({
        target: serviceConfig.fallback,
        changeOrigin: true,
        pathRewrite: (path) => path.replace('/api', ''),
        onError: (err, req, res) => {
          res.status(503).json({
            error: 'Service unavailable',
            service: serviceConfig.service,
            timestamp: new Date()
          });
        }
      });

      return proxy(req, res, next);
    }
  }
}
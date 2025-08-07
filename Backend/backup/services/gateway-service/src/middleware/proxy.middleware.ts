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
    '/api/auth': { service: 'auth-service', fallback: 'http:
    '/api/publications': { service: 'publications-service', fallback: 'http:
    '/api/catalog': { service: 'catalog-service', fallback: 'http:
    '/api/notifications': { service: 'notifications-service', fallback: 'http:
  };
  async use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;
    let targetService: ServiceConfig | null = null;
    for (const [route, config] of Object.entries(this.serviceRoutes)) {
      if (path.startsWith(route)) {
        targetService = config;
        break;
      }
    }
    if (!targetService) {
      return next();
    }
    const serviceConfig = targetService as ServiceConfig;
    try {
      const instances = await consul.health.service(serviceConfig.service);
      const healthyInstances = instances.filter(instance => 
        instance.Checks.every(check => check.Status === 'passing')
      );
      let target = serviceConfig.fallback;
      if (healthyInstances.length > 0) {
        const instance = healthyInstances[0]; 
        target = `http:
      }
      const proxy = createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: (path) => {
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
        timeout: 5000, 
        proxyTimeout: 5000,
      });
      return proxy(req, res, next);
    } catch (error) {
      console.error(`Service discovery failed for ${serviceConfig.service}:`, error.message);
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
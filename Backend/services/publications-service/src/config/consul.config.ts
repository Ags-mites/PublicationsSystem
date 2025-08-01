import { registerAs } from '@nestjs/config';

export const consulConfig = registerAs('consul', () => ({
  host: process.env.CONSUL_HOST || 'localhost',
  port: parseInt(process.env.CONSUL_PORT || '8500', 10),
  serviceName: process.env.CONSUL_SERVICE_NAME || 'publications-service',
  serviceId: process.env.CONSUL_SERVICE_ID || `publications-service-${process.env.NODE_ENV || 'dev'}`,
  healthCheckInterval: process.env.CONSUL_HEALTH_CHECK_INTERVAL || '10s',
  healthCheckTimeout: process.env.CONSUL_HEALTH_CHECK_TIMEOUT || '5s',
  tags: process.env.CONSUL_TAGS?.split(',') || ['publications', 'academic', 'microservice'],
  meta: {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
}));
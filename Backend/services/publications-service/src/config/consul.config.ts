import { registerAs } from '@nestjs/config';

export const consulConfig = registerAs('consul', () => ({
  host: process.env.CONSUL_HOST || 'localhost',
  port: parseInt(process.env.CONSUL_PORT || '8500', 10),
  serviceName: process.env.CONSUL_SERVICE_NAME || 'publications-service',
  serviceId: process.env.CONSUL_SERVICE_ID || 'publications-service-1',
}));
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3003', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'catalog-service',
  consulUrl: process.env.CONSUL_URL || 'http://localhost:8500',
}));
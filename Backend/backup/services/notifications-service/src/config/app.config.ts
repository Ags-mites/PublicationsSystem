import { registerAs } from '@nestjs/config';
export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3004', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'notifications-service',
  frontendUrl: process.env.FRONTEND_URL || 'http:
}));
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'gateway-service',
  consulUrl: process.env.CONSUL_URL || 'http://localhost:8500',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
}));
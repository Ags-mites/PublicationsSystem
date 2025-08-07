import { registerAs } from '@nestjs/config';
export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'gateway-service',
  consulUrl: process.env.CONSUL_URL || 'http:
  frontendUrl: process.env.FRONTEND_URL || 'http:
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http:
}));
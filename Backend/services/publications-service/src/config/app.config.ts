import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
    name: process.env.APP_NAME || 'publications-service',
    port: parseInt(process.env.PORT ?? '3002', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    environment: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    logLevel: process.env.LOG_LEVEL || 'info',
    timeoutMs: parseInt(process.env.TIMEOUT_MS ?? '30000', 10),
}));
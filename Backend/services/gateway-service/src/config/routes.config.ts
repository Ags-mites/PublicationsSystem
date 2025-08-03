import { ServiceRoute } from '../interfaces/route.interface';

export const routeConfig: ServiceRoute[] = [
  {
    pattern: '/api/auth/*',
    serviceId: 'auth-service',
    stripPrefix: true,
    requireAuth: false,
    rateLimit: {
      windowMs: 300000, // 5 minutes
      max: 10, // 10 login attempts per 5min
    },
  },
  {
    pattern: '/api/publications/*',
    serviceId: 'publications-service',
    stripPrefix: true,
    requireAuth: true,
    roles: ['ROLE_AUTOR', 'ROLE_REVISOR', 'ROLE_EDITOR', 'ROLE_ADMIN'],
    rateLimit: {
      windowMs: 60000, // 1 minute
      max: 50, // 50 requests per minute
    },
  },
  {
    pattern: '/api/authors/*',
    serviceId: 'publications-service',
    stripPrefix: true,
    requireAuth: true,
    roles: ['ROLE_AUTOR', 'ROLE_REVISOR', 'ROLE_EDITOR', 'ROLE_ADMIN'],
    rateLimit: {
      windowMs: 60000, // 1 minute
      max: 50, // 50 requests per minute
    },
  },
  {
    pattern: '/api/reviews/*',
    serviceId: 'publications-service',
    stripPrefix: true,
    requireAuth: true,
    roles: ['ROLE_REVISOR', 'ROLE_EDITOR', 'ROLE_ADMIN'],
    rateLimit: {
      windowMs: 60000, // 1 minute
      max: 30, // 30 requests per minute
    },
  },
  {
    pattern: '/api/catalog/*',
    serviceId: 'catalog-service',
    stripPrefix: true,
    requireAuth: false, // Public access
    rateLimit: {
      windowMs: 60000, // 1 minute
      max: 100, // 100 requests per minute
    },
  },
  {
    pattern: '/api/notifications/*',
    serviceId: 'notifications-service',
    stripPrefix: true,
    requireAuth: true,
    rateLimit: {
      windowMs: 60000, // 1 minute
      max: 30, // 30 requests per minute
    },
  },
];

export const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/jwks',
  '/api/catalog/*',
  '/health',
  '/health/services',
  '/metrics',
];

export const noAuthRoutes = [
  '/api/auth/*',
  '/api/catalog/*',
  '/health',
  '/health/services',
  '/metrics',
];
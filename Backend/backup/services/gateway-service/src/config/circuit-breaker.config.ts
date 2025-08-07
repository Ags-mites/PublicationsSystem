import { CircuitBreakerConfig } from '../interfaces/circuit-breaker.interface';
export const circuitBreakerConfigs: Record<string, CircuitBreakerConfig> = {
  'auth-service': {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 60000,
    fallbackResponse: {
      statusCode: 503,
      message: 'Authentication service temporarily unavailable',
      data: {
        service: 'auth-service',
        status: 'circuit_open',
        retryAfter: 60,
      },
    },
  },
  'publications-service': {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000,
    fallbackResponse: {
      statusCode: 503,
      message: 'Publications service temporarily unavailable',
      data: {
        service: 'publications-service',
        status: 'circuit_open',
        retryAfter: 30,
      },
    },
  },
  'catalog-service': {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 45000,
    fallbackResponse: {
      statusCode: 503,
      message: 'Catalog service temporarily unavailable',
      data: {
        service: 'catalog-service',
        status: 'circuit_open',
        retryAfter: 45,
      },
    },
  },
  'notifications-service': {
    failureThreshold: 4,
    successThreshold: 2,
    timeout: 30000,
    fallbackResponse: {
      statusCode: 503,
      message: 'Notifications service temporarily unavailable',
      data: {
        service: 'notifications-service',
        status: 'circuit_open',
        retryAfter: 30,
      },
    },
  },
};
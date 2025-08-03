// API Configuration for Academic Publications Management System

import { ApiHeaders } from '../types/api';

// Environment configuration
const isDevelopment = import.meta.env.DEV;
const useMockServer = import.meta.env.VITE_USE_MOCK_SERVER === 'true';

// API Base URLs
export const API_BASE_URL = isDevelopment && useMockServer
  ? 'http://localhost:3001'
  : 'http://localhost:3000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth Service
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
    LOGOUT: '/api/auth/logout',
    INTROSPECT: '/api/auth/introspect',
    JWKS: '/api/auth/jwks',
    USERS: '/api/auth/users'
  },
  
  // Publications Service
  PUBLICATIONS: {
    LIST: '/api/publications',
    DETAIL: (id: string) => `/api/publications/${id}`,
    CREATE: '/api/publications',
    UPDATE: (id: string) => `/api/publications/${id}`,
    DELETE: (id: string) => `/api/publications/${id}`,
    SUBMIT_FOR_REVIEW: (id: string) => `/api/publications/${id}/submit-for-review`,
    APPROVE: (id: string) => `/api/publications/${id}/approve`,
    PUBLISH: (id: string) => `/api/publications/${id}/publish`,
    WITHDRAW: (id: string) => `/api/publications/${id}/withdraw`,
    HISTORY: (id: string) => `/api/publications/${id}/history`
  },
  
  // Catalog Service
  CATALOG: {
    PUBLICATIONS: '/api/catalog/publications',
    PUBLICATION_DETAIL: (id: string) => `/api/catalog/publications/${id}`,
    SEARCH: '/api/catalog/search',
    CATEGORIES: '/api/catalog/categories',
    STATISTICS: '/api/catalog/statistics'
  },
  
  // Notifications Service
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    UNREAD_COUNT: '/api/notifications/unread-count',
    MARK_READ: (id: string) => `/api/notifications/${id}`,
    MARK_ALL_READ: '/api/notifications/mark-all-read',
    DELETE: (id: string) => `/api/notifications/${id}`,
    CLEAR_ALL: '/api/notifications/clear-all',
    STATS: '/api/notifications/stats'
  },
  
  // Health Check
  HEALTH: '/health'
} as const;

// Default headers
export const getDefaultHeaders = (): ApiHeaders => ({
  'Content-Type': 'application/json',
  'X-Correlation-ID': generateCorrelationId()
});

// Headers with authentication
export const getAuthHeaders = (token: string): ApiHeaders => ({
  ...getDefaultHeaders(),
  'Authorization': `Bearer ${token}`
});

// Generate correlation ID for request tracing
export function generateCorrelationId(): string {
  return `frontend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// API Response wrapper
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

export const API_CONFIG: ApiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000 // 1 second
};

// Error handling
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: string[],
    public correlationId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request wrapper with retry logic
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  config: Partial<ApiConfig> = {}
): Promise<T> {
  const finalConfig = { ...API_CONFIG, ...config };
  const url = `${finalConfig.baseURL}${endpoint}`;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= finalConfig.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...getDefaultHeaders(),
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.message || `HTTP ${response.status}`,
          errorData.errors,
          errorData.correlationId
        );
      }
      
      return await response.json();
      
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === finalConfig.retries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay * (attempt + 1)));
    }
  }
  
  throw lastError!;
}

// Convenience methods for common HTTP methods
export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>): Promise<T> =>
    apiRequest<T>(endpoint, { method: 'GET', headers }),
    
  post: <T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined
    }),
    
  put: <T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined
    }),
    
  delete: <T>(endpoint: string, headers?: Record<string, string>): Promise<T> =>
    apiRequest<T>(endpoint, { method: 'DELETE', headers }),
    
  patch: <T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined
    })
};

// WebSocket configuration
export const WS_CONFIG = {
  baseURL: isDevelopment && useMockServer
    ? 'ws://localhost:3001'
    : 'ws://localhost:3000',
  reconnectAttempts: 5,
  reconnectDelay: 1000
};

// Environment info for debugging
export const ENV_INFO = {
  isDevelopment,
  useMockServer,
  apiBaseUrl: API_BASE_URL,
  wsBaseUrl: WS_CONFIG.baseURL
};

// Log environment info in development
if (isDevelopment) {
  console.log('API Configuration:', ENV_INFO);
} 
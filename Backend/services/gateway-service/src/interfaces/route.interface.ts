export interface ServiceRoute {
  pattern: string;
  serviceId: string;
  stripPrefix: boolean;
  requireAuth: boolean;
  roles?: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export interface ServiceInstance {
  serviceId: string;
  host: string;
  port: number;
  health: 'passing' | 'warning' | 'critical';
  lastChecked: Date;
  tags?: string[];
  meta?: Record<string, string>;
}

export interface ProxyRequest {
  originalUrl: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  user?: any;
  serviceRoute?: ServiceRoute;
}
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConsulService } from '../consul/consul.service';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { routeConfig } from '../config/routes.config';
import { ServiceRoute, ProxyRequest } from '../interfaces/route.interface';
import { AuthenticatedRequest } from '../auth/auth.middleware';

export interface ProxyResponse {
  statusCode: number;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  serviceUrl: string;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly timeout = 30000; // 30 seconds

  constructor(
    private consulService: ConsulService,
    private circuitBreakerService: CircuitBreakerService,
    private configService: ConfigService,
  ) {}

  async proxyRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    let serviceUrl: string | null = null;

    try {
      const path = req.originalUrl || req.url;
      const method = req.method;

      this.logger.debug(`Proxying request: ${method} ${path}`);

      // Find matching route
      const serviceRoute = this.findMatchingRoute(path);
      if (!serviceRoute) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            timestamp: new Date().toISOString(),
            path,
            method,
            message: 'Route not found',
            service: 'gateway',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Get service URL from Consul
      serviceUrl = await this.consulService.getServiceUrl(serviceRoute.serviceId);
      if (!serviceUrl) {
        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            timestamp: new Date().toISOString(),
            path,
            method,
            message: `Service ${serviceRoute.serviceId} is unavailable`,
            service: 'gateway',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Prepare proxy request
      const proxyRequest = this.prepareProxyRequest(req, serviceRoute, serviceUrl);

      // Execute request with circuit breaker
      const response = await this.circuitBreakerService.executeWithCircuitBreaker(
        serviceRoute.serviceId,
        () => this.executeRequest(proxyRequest),
      );

      // Forward response
      await this.forwardResponse(res, response, startTime, serviceUrl);

    } catch (error) {
      await this.handleProxyError(error, req, res, startTime, serviceUrl);
    }
  }

  private findMatchingRoute(path: string): ServiceRoute | null {
    for (const route of routeConfig) {
      const pattern = route.pattern.replace('*', '.*');
      const regex = new RegExp(`^${pattern}`);
      
      if (regex.test(path)) {
        return route;
      }
    }
    return null;
  }

  private prepareProxyRequest(
    req: AuthenticatedRequest,
    serviceRoute: ServiceRoute,
    serviceUrl: string,
  ): ProxyRequest {
    let targetPath = req.originalUrl || req.url;

    // Strip prefix if configured
    if (serviceRoute.stripPrefix) {
      const prefixPattern = serviceRoute.pattern.replace('/*', '');
      if (targetPath.startsWith(prefixPattern)) {
        targetPath = targetPath.substring(prefixPattern.length);
        if (!targetPath.startsWith('/')) {
          targetPath = '/' + targetPath;
        }
      }
    }

    // Prepare headers - clean and convert to Record<string, string>
    const headers: Record<string, string> = {};
    
    // Copy headers from request, ensuring string values
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value.join(', ');
      }
    });
    
    // Remove hop-by-hop headers
    delete headers['connection'];
    delete headers['keep-alive'];
    delete headers['proxy-authenticate'];
    delete headers['proxy-authorization'];
    delete headers['te'];
    delete headers['trailers'];
    delete headers['transfer-encoding'];
    delete headers['upgrade'];

    // Add forwarded headers
    headers['x-forwarded-for'] = req.ip || 'unknown';
    headers['x-forwarded-proto'] = req.protocol;
    headers['x-forwarded-host'] = req.get('host') || '';
    headers['x-real-ip'] = req.ip || 'unknown';

    // Add user information if authenticated
    if (req.user) {
      headers['x-user-id'] = req.user.sub;
      headers['x-user-email'] = req.user.email;
      headers['x-user-roles'] = JSON.stringify(req.user.roles);
    }

    // Add service identification
    headers['x-gateway-service'] = 'api-gateway';
    headers['x-request-id'] = this.generateRequestId();

    return {
      originalUrl: serviceUrl + targetPath,
      method: req.method,
      headers,
      body: req.body,
      user: req.user,
      serviceRoute,
    };
  }

  private async executeRequest(proxyRequest: ProxyRequest): Promise<ProxyResponse> {
    const startTime = Date.now();

    try {
      const config: AxiosRequestConfig = {
        method: proxyRequest.method as any,
        url: proxyRequest.originalUrl,
        headers: proxyRequest.headers,
        timeout: this.timeout,
        validateStatus: () => true, // Don't throw on any status code
      };

      // Add body for POST, PUT, PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(proxyRequest.method.toUpperCase())) {
        config.data = proxyRequest.body;
      }

      // Add query parameters for GET, DELETE requests
      if (['GET', 'DELETE'].includes(proxyRequest.method.toUpperCase()) && proxyRequest.body) {
        config.params = proxyRequest.body;
      }

      this.logger.debug(`Executing request to: ${proxyRequest.originalUrl}`);

      const response: AxiosResponse = await axios(config);
      const responseTime = Date.now() - startTime;

      // Prepare response headers - clean and convert to Record<string, string>
      const responseHeaders: Record<string, string> = {};
      
      // Copy headers from response, ensuring string values
      Object.entries(response.headers).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          responseHeaders[key] = value;
        } else if (Array.isArray(value)) {
          responseHeaders[key] = value.join(', ');
        } else if (value) {
          responseHeaders[key] = String(value);
        }
      });
      
      // Remove headers that shouldn't be forwarded
      delete responseHeaders['transfer-encoding'];
      delete responseHeaders['connection'];
      delete responseHeaders['keep-alive'];

      return {
        statusCode: response.status,
        headers: responseHeaders,
        data: response.data,
        responseTime,
        serviceUrl: proxyRequest.originalUrl,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.code === 'ECONNABORTED') {
        throw new HttpException(
          {
            statusCode: HttpStatus.GATEWAY_TIMEOUT,
            timestamp: new Date().toISOString(),
            message: 'Service request timeout',
            service: 'gateway',
            responseTime,
          },
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_GATEWAY,
            timestamp: new Date().toISOString(),
            message: 'Service connection failed',
            service: 'gateway',
            responseTime,
          },
          HttpStatus.BAD_GATEWAY,
        );
      }

      throw error;
    }
  }

  private async forwardResponse(
    res: Response,
    proxyResponse: ProxyResponse,
    startTime: number,
    serviceUrl: string,
  ): Promise<void> {
    const totalTime = Date.now() - startTime;

    // Set response headers
    Object.entries(proxyResponse.headers).forEach(([key, value]) => {
      if (value !== undefined) {
        res.set(key, value);
      }
    });

    // Add gateway headers
    res.set({
      'X-Gateway-Service': 'api-gateway',
      'X-Response-Time': `${totalTime}ms`,
      'X-Service-Time': `${proxyResponse.responseTime}ms`,
      'X-Upstream-Service': serviceUrl,
    });

    this.logger.debug(
      `Response forwarded: ${proxyResponse.statusCode} in ${totalTime}ms (service: ${proxyResponse.responseTime}ms)`,
    );

    // Send response
    res.status(proxyResponse.statusCode).json(proxyResponse.data);
  }

  private async handleProxyError(
    error: any,
    req: AuthenticatedRequest,
    res: Response,
    startTime: number,
    serviceUrl: string | null,
  ): Promise<void> {
    const totalTime = Date.now() - startTime;
    const path = req.originalUrl || req.url;
    const method = req.method;

    // Add gateway headers
    res.set({
      'X-Gateway-Service': 'api-gateway',
      'X-Response-Time': `${totalTime}ms`,
      'X-Upstream-Service': serviceUrl || 'unknown',
    });

    if (error instanceof HttpException) {
      this.logger.warn(`Proxy error: ${error.message}`);
      res.status(error.getStatus()).json(error.getResponse());
      return;
    }

    // Handle circuit breaker fallback responses
    if (error && typeof error === 'object' && error.circuitBreakerTriggered) {
      this.logger.warn(`Circuit breaker triggered for ${path}`);
      res.status(error.statusCode || 503).json(error);
      return;
    }

    this.logger.error(`Proxy error for ${method} ${path}: ${error.message}`, error.stack);

    res.status(500).json({
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path,
      method,
      message: 'Internal gateway error',
      service: 'gateway',
      responseTime: totalTime,
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check and monitoring methods
  async getProxyStats(): Promise<any> {
    const consulStats = this.consulService.getCacheStats();
    const circuitStats = this.circuitBreakerService.getAllCircuitBreakerStats();
    const healthStats = this.circuitBreakerService.getAllHealthStatus();

    return {
      consul: consulStats,
      circuitBreakers: circuitStats,
      health: healthStats,
      routes: routeConfig.length,
      uptime: process.uptime(),
    };
  }

  async testServiceConnectivity(serviceId: string): Promise<any> {
    try {
      const serviceUrl = await this.consulService.getServiceUrl(serviceId);
      if (!serviceUrl) {
        return {
          serviceId,
          status: 'unavailable',
          message: 'Service not found in Consul',
        };
      }

      const startTime = Date.now();
      const response = await axios.get(`${serviceUrl}/health`, { timeout: 5000 });
      const responseTime = Date.now() - startTime;

      return {
        serviceId,
        status: 'healthy',
        serviceUrl,
        responseTime,
        statusCode: response.status,
        data: response.data,
      };

    } catch (error) {
      return {
        serviceId,
        status: 'unhealthy',
        message: error.message,
        responseTime: -1,
      };
    }
  }
}
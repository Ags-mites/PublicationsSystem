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
  private readonly timeout = 30000; 
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
      const proxyRequest = this.prepareProxyRequest(req, serviceRoute, serviceUrl);
      const response = await this.circuitBreakerService.executeWithCircuitBreaker(
        serviceRoute.serviceId,
        () => this.executeRequest(proxyRequest),
      );
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
    if (serviceRoute.stripPrefix) {

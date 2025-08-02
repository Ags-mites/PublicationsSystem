import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimitService, RateLimitConfig } from './rate-limit.service';
import { AuthenticatedRequest } from '../auth/auth.middleware';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  // Global rate limits
  private readonly globalIpLimit: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
  };

  private readonly globalUserLimit: RateLimitConfig = {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // 1000 requests per hour per user
  };

  private readonly authLimit: RateLimitConfig = {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 auth attempts per 5 minutes per IP
  };

  constructor(private rateLimitService: RateLimitService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const path = req.originalUrl || req.url;
      const method = req.method;

      this.logger.debug(`Rate limit check for ${method} ${path}`);

      // 1. Global IP-based rate limiting
      const ipKey = this.rateLimitService.generateIpKey(req);
      const ipCheck = await this.rateLimitService.checkRateLimit(
        ipKey,
        this.globalIpLimit,
        req,
      );

      if (!ipCheck.allowed) {
        this.rateLimitService.setHeaders(res, ipCheck.info);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method,
            message: 'Too many requests from this IP',
            service: 'gateway',
            retryAfter: Math.ceil((ipCheck.info.resetTime.getTime() - Date.now()) / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // 2. Authentication-specific rate limiting
      if (this.isAuthRoute(path)) {
        const authKey = this.rateLimitService.generateAuthKey(req);
        const authCheck = await this.rateLimitService.checkRateLimit(
          authKey,
          this.authLimit,
          req,
        );

        if (!authCheck.allowed) {
          this.rateLimitService.setHeaders(res, authCheck.info);
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              timestamp: new Date().toISOString(),
              path: req.originalUrl,
              method: req.method,
              message: 'Too many authentication attempts',
              service: 'gateway',
              retryAfter: Math.ceil((authCheck.info.resetTime.getTime() - Date.now()) / 1000),
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      // 3. User-based rate limiting (for authenticated users)
      if (req.user) {
        const userKey = this.rateLimitService.generateUserKey(req, req.user.sub);
        const userCheck = await this.rateLimitService.checkRateLimit(
          userKey,
          this.globalUserLimit,
          req,
        );

        if (!userCheck.allowed) {
          this.rateLimitService.setHeaders(res, userCheck.info);
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              timestamp: new Date().toISOString(),
              path: req.originalUrl,
              method: req.method,
              message: 'Too many requests from this user',
              service: 'gateway',
              retryAfter: Math.ceil((userCheck.info.resetTime.getTime() - Date.now()) / 1000),
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      // 4. Route-specific rate limiting
      if (req.serviceRoute?.rateLimit) {
        const routeKey = this.rateLimitService.generateRouteKey(
          req,
          req.serviceRoute.serviceId,
        );
        const routeCheck = await this.rateLimitService.checkRateLimit(
          routeKey,
          req.serviceRoute.rateLimit,
          req,
        );

        if (!routeCheck.allowed) {
          this.rateLimitService.setHeaders(res, routeCheck.info);
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              timestamp: new Date().toISOString(),
              path: req.originalUrl,
              method: req.method,
              message: `Too many requests to ${req.serviceRoute.serviceId}`,
              service: 'gateway',
              retryAfter: Math.ceil((routeCheck.info.resetTime.getTime() - Date.now()) / 1000),
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      // Set rate limit headers for successful requests
      this.rateLimitService.setHeaders(res, ipCheck.info);

      this.logger.debug(`Rate limit passed for ${method} ${path}`);
      next();

    } catch (error) {
      if (error instanceof HttpException) {
        this.logger.warn(`Rate limit exceeded: ${error.message}`);
        return res.status(error.getStatus()).json(error.getResponse());
      }

      this.logger.error(`Rate limit middleware error: ${error.message}`, error.stack);
      return res.status(500).json({
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        message: 'Internal rate limiting error',
        service: 'gateway',
      });
    }
  }

  private isAuthRoute(path: string): boolean {
    const authPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
    ];

    return authPaths.some(authPath => path.startsWith(authPath));
  }
}
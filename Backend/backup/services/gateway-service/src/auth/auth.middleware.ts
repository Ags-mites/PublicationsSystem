import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from './jwt.service';
import { routeConfig, noAuthRoutes } from '../config/routes.config';
import { ServiceRoute } from '../interfaces/route.interface';
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  serviceRoute?: ServiceRoute;
}
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);
  constructor(private jwtService: JwtService) {}
  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const path = req.originalUrl || req.url;
      const method = req.method;
      this.logger.debug(`Processing auth for ${method} ${path}`);
      const serviceRoute = this.findMatchingRoute(path);
      if (serviceRoute) {
        req.serviceRoute = serviceRoute;
      }
      if (this.isPublicRoute(path) || !this.requiresAuth(serviceRoute)) {
        this.logger.debug(`Public route, skipping auth: ${path}`);
        return next();
      }
      const token = this.jwtService.extractTokenFromRequest(req);
      if (!token) {
        throw new UnauthorizedException('Authentication token required');
      }
      let user: JwtPayload;
      try {
        user = await this.jwtService.validateToken(token);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          this.logger.warn('JWKS validation failed, falling back to simple validation');
          user = await this.jwtService.validateTokenSimple(token);
        } else {
          throw error;
        }
      }
      if (serviceRoute?.roles) {
        if (!this.jwtService.hasRole(user.roles, serviceRoute.roles)) {
          throw new ForbiddenException('Insufficient permissions');
        }
      }
      req.user = user;
      this.logger.debug(`Auth successful for user: ${user.email}`);
      next();
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        this.logger.warn(`Auth failed: ${error.message}`);
        return res.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
          method: req.method,
          message: error.message,
          service: 'gateway',
        });
      }
      this.logger.error(`Auth middleware error: ${error.message}`, error.stack);
      return res.status(500).json({
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        message: 'Internal authentication error',
        service: 'gateway',
      });
    }
  }
  private findMatchingRoute(path: string): ServiceRoute | null {
    for (const route of routeConfig) {
      const pattern = route.pattern.replace('*', '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(path)) {
        return route;
      }
    }
    return null;
  }
  private isPublicRoute(path: string): boolean {
    return noAuthRoutes.some(route => {
      if (route.endsWith('*')) {
        const prefix = route.slice(0, -1);
        return path.startsWith(prefix);
      }
      return path === route;
    });
  }
  private requiresAuth(serviceRoute: ServiceRoute | null): boolean {
    if (!serviceRoute) {
      return true;
    }
    return serviceRoute.requireAuth;
  }
}
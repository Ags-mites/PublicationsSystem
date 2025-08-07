import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private helmetMiddleware: any;
  constructor(private configService: ConfigService) {
    this.helmetMiddleware = helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000, 
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'same-origin' },
      xssFilter: true,
    });
  }
  use(req: Request, res: Response, next: NextFunction) {
    this.helmetMiddleware(req, res, (err: any) => {
      if (err) {
        this.logger.error(`Security middleware error: ${err.message}`);
        return next(err);
      }
      this.addCustomSecurityHeaders(req, res);
      this.logSecurityEvents(req);
      next();
    });
  }
  private addCustomSecurityHeaders(req: Request, res: Response): void {
    res.removeHeader('X-Powered-By');
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Cache-Control': this.getCacheControlHeader(req.path),
      'X-Gateway-Version': this.configService.get<string>('APP_VERSION', '1.0.0'),
    });
    if (!res.get('Access-Control-Allow-Origin')) {
      this.addCorsHeaders(req, res);
    }
  }
  private addCorsHeaders(req: Request, res: Response): void {
    const allowedOrigins = this.configService.get<string>('CORS_ORIGINS', 'http:
    const origin = req.get('origin');
    if (origin && allowedOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigins.includes('*')) {
      res.set('Access-Control-Allow-Origin', '*');
    }
    res.set({
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Request-ID',
      'Access-Control-Expose-Headers': 'X-Total-Count, X-Request-ID, X-Response-Time',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', 
    });
  }
  private getCacheControlHeader(path: string): string {
    if (path.includes('/auth') || path.includes('/admin')) {
      return 'no-cache, no-store, must-revalidate, private';
    }
    if (path.startsWith('/api')) {
      return 'no-cache, max-age=0';
    }
    return 'no-cache';
  }
  private logSecurityEvents(req: Request): void {
    const securityHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'user-agent',
      'referer',
      'origin',
    ];
    const securityInfo: any = {
      ip: req.ip,
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString(),
    };
    securityHeaders.forEach(header => {
      const value = req.get(header);
      if (value) {
        securityInfo[header] = value;
      }
    });
    this.detectSuspiciousActivity(req, securityInfo);
    this.logger.debug(`Security check: ${JSON.stringify(securityInfo)}`);
  }
  private detectSuspiciousActivity(req: Request, securityInfo: any): void {
    const suspiciousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i,
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /\.\.[\/\\]/,
      /[;&|`$]/,
    ];
    const url = req.originalUrl || req.url;
    const userAgent = req.get('user-agent') || '';
    const body = JSON.stringify(req.body || {});
    const textToCheck = `${url} ${userAgent} ${body}`;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(textToCheck)) {
        this.logger.warn(`Suspicious activity detected: ${pattern.source}`, {
          ...securityInfo,
          pattern: pattern.source,
          matchedText: textToCheck.match(pattern)?.[0],
        });
        break;
      }
    }
    if (!userAgent || userAgent.length < 10 || /bot|crawler|spider/i.test(userAgent)) {
      this.logger.debug(`Unusual user agent detected: ${userAgent}`, securityInfo);
    }
  }
}
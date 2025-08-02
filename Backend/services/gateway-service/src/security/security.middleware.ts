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
      // Content Security Policy
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
      
      // Cross-Origin Embedder Policy
      crossOriginEmbedderPolicy: false,
      
      // Hide X-Powered-By header
      hidePoweredBy: true,
      
      // HSTS (HTTP Strict Transport Security)
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      
      // X-Frame-Options
      frameguard: { action: 'deny' },
      
      // X-Content-Type-Options
      noSniff: true,
      
      // Referrer Policy
      referrerPolicy: { policy: 'same-origin' },
      
      // X-XSS-Protection
      xssFilter: true,
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Apply helmet security headers
    this.helmetMiddleware(req, res, (err: any) => {
      if (err) {
        this.logger.error(`Security middleware error: ${err.message}`);
        return next(err);
      }

      // Additional security headers
      this.addCustomSecurityHeaders(req, res);
      
      // Security logging
      this.logSecurityEvents(req);
      
      next();
    });
  }

  private addCustomSecurityHeaders(req: Request, res: Response): void {
    // Remove server identification
    res.removeHeader('X-Powered-By');
    
    // Add custom security headers
    res.set({
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // Enable XSS filtering
      'X-XSS-Protection': '1; mode=block',
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Feature policy / Permissions policy
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      
      // Cache control for sensitive endpoints
      'Cache-Control': this.getCacheControlHeader(req.path),
      
      // API Gateway identification
      'X-Gateway-Version': this.configService.get<string>('APP_VERSION', '1.0.0'),
    });

    // Add CORS headers if not handled by CORS middleware
    if (!res.get('Access-Control-Allow-Origin')) {
      this.addCorsHeaders(req, res);
    }
  }

  private addCorsHeaders(req: Request, res: Response): void {
    const allowedOrigins = this.configService.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(',');
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
      'Access-Control-Max-Age': '86400', // 24 hours
    });
  }

  private getCacheControlHeader(path: string): string {
    // No cache for auth and sensitive endpoints
    if (path.includes('/auth') || path.includes('/admin')) {
      return 'no-cache, no-store, must-revalidate, private';
    }
    
    // Short cache for API endpoints
    if (path.startsWith('/api')) {
      return 'no-cache, max-age=0';
    }
    
    // Default cache control
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

    // Check for suspicious patterns
    this.detectSuspiciousActivity(req, securityInfo);
    
    // Log security events in debug mode
    this.logger.debug(`Security check: ${JSON.stringify(securityInfo)}`);
  }

  private detectSuspiciousActivity(req: Request, securityInfo: any): void {
    const suspiciousPatterns = [
      // SQL injection patterns
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i,
      
      // XSS patterns
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      
      // Path traversal
      /\.\.[\/\\]/,
      
      // Command injection
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

    // Check for unusual request rates from same IP
    // This would typically be handled by rate limiting middleware
    
    // Check for invalid user agents
    if (!userAgent || userAgent.length < 10 || /bot|crawler|spider/i.test(userAgent)) {
      this.logger.debug(`Unusual user agent detected: ${userAgent}`, securityInfo);
    }
  }
}
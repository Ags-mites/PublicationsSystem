import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly cleanupInterval = 60000; // 1 minute

  constructor(private configService: ConfigService) {
    // Start cleanup interval to remove expired entries
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  async checkRateLimit(
    key: string,
    config: RateLimitConfig,
    req: Request,
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const now = Date.now();
    const resetTime = Math.ceil(now / config.windowMs) * config.windowMs;
    
    const entry = this.store.get(key) || { count: 0, resetTime };
    
    // Reset counter if window has expired
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = resetTime;
    }

    const info: RateLimitInfo = {
      limit: config.max,
      current: entry.count,
      remaining: Math.max(0, config.max - entry.count),
      resetTime: new Date(entry.resetTime),
    };

    if (entry.count >= config.max) {
      this.logger.warn(`Rate limit exceeded for key: ${key}`);
      return { allowed: false, info };
    }

    // Increment counter
    entry.count++;
    this.store.set(key, entry);

    this.logger.debug(`Rate limit check for ${key}: ${entry.count}/${config.max}`);
    
    return { 
      allowed: true, 
      info: {
        ...info,
        current: entry.count,
        remaining: Math.max(0, config.max - entry.count),
      }
    };
  }

  generateIpKey(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded?.split(',')[0] || req.connection.remoteAddress || req.ip;
    return `ip:${ip}`;
  }

  generateUserKey(req: Request, userId: string): string {
    return `user:${userId}`;
  }

  generateRouteKey(req: Request, route: string): string {
    const ip = this.generateIpKey(req);
    return `route:${route}:${ip}`;
  }

  generateAuthKey(req: Request): string {
    const ip = this.generateIpKey(req);
    return `auth:${ip}`;
  }

  setHeaders(res: Response, info: RateLimitInfo): void {
    res.set({
      'X-RateLimit-Limit': info.limit.toString(),
      'X-RateLimit-Remaining': info.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(info.resetTime.getTime() / 1000).toString(),
    });
  }

  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime + 60000) { // Remove entries 1 minute after reset
        this.store.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} expired rate limit entries`);
    }
  }

  getStats(): any {
    return {
      totalEntries: this.store.size,
      memoryUsage: JSON.stringify([...this.store.entries()]).length,
      lastCleanup: new Date(),
    };
  }

  clearKey(key: string): void {
    this.store.delete(key);
  }

  clearAll(): void {
    this.store.clear();
  }
}
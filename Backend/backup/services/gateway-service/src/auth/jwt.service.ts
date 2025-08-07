import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as jwksRsa from 'jwks-rsa';
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
}
@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private jwksClient: any;
  constructor(private configService: ConfigService) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http:
    this.jwksClient = jwksRsa({
      jwksUri: `${authServiceUrl}/api/auth/jwks`,
      cache: true,
      cacheMaxEntries: 5,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decodedHeader = jwt.decode(token, { complete: true });
      if (!decodedHeader || typeof decodedHeader === 'string') {
        throw new UnauthorizedException('Invalid token format');
      }
      const kid = decodedHeader.header.kid;
      if (!kid) {
        throw new UnauthorizedException('Token missing key ID');
      }
      const key = await this.getSigningKey(kid);
      const payload = jwt.verify(token, key, {
        algorithms: ['RS256'],
        issuer: this.configService.get<string>('JWT_ISSUER'),
        audience: this.configService.get<string>('JWT_AUDIENCE'),
      }) as JwtPayload;
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Token has expired');
      }
      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException('Token missing required claims');
      }
      this.logger.debug(`Token validated for user: ${payload.email}`);
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Token validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
  async validateTokenSimple(token: string): Promise<JwtPayload> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = jwt.verify(token, secret || '', {
        algorithms: ['HS256'],
      }) as JwtPayload;
      return payload;
    } catch (error) {
      this.logger.error(`Simple token validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
  private async getSigningKey(kid: string): Promise<string> {
    try {
      const signingKey = await this.jwksClient.getSigningKey(kid);
      return signingKey.getPublicKey();
    } catch (error) {
      this.logger.error(`Failed to get signing key: ${error.message}`);
      throw new UnauthorizedException('Failed to verify token signature');
    }
  }
  extractTokenFromRequest(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }
    return token;
  }
  hasRole(userRoles: string[], requiredRoles: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; 
    }
    if (!userRoles || userRoles.length === 0) {
      return false; 
    }
    return requiredRoles.some(role => userRoles.includes(role));
  }
  isTokenExpired(payload: JwtPayload): boolean {
    if (!payload.exp) {
      return false; 
    }
    return payload.exp < Math.floor(Date.now() / 1000);
  }
  getTokenTTL(payload: JwtPayload): number {
    if (!payload.exp) {
      return -1; 
    }
    return payload.exp - Math.floor(Date.now() / 1000);
  }
}
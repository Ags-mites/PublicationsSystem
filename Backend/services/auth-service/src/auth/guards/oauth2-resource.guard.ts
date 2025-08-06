import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../services/auth.service';

@Injectable()
export class OAuth2ResourceGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Access token required');
    }

    try {
      // Validate token using introspection
      const introspection = await this.authService.introspectToken(token);
      
      if (!introspection.active) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Check required scopes
      const requiredScopes = this.reflector.get<string[]>('oauth2_scopes', context.getHandler());
      if (requiredScopes && requiredScopes.length > 0) {
        const tokenScopes = introspection.scope?.split(' ') || [];
        const hasRequiredScopes = requiredScopes.every(scope => tokenScopes.includes(scope));
        
        if (!hasRequiredScopes) {
          throw new UnauthorizedException('Insufficient scopes');
        }
      }

      // Attach user info to request
      request.user = {
        sub: introspection.sub,
        email: introspection.email,
        roles: introspection.roles,
        scope: introspection.scope,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 
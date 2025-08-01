import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class MicroserviceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userInfo = request.headers['x-user-info'];
    
    if (!userInfo) {
      return false;
    }
    
    try {
      // Parse user info from header (set by API Gateway)
      const user = JSON.parse(userInfo);
      request.user = user;
      return true;
    } catch {
      return false;
    }
  }
} 
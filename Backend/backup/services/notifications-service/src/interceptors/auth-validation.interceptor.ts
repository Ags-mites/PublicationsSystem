import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthClientService } from '../services/auth-client.service';
@Injectable()
export class AuthValidationInterceptor implements NestInterceptor {
  constructor(private authClient: AuthClientService) {}
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '') ||
                  request.headers['x-auth-token'] ||
                  request.query.token;
    if (!token) {
      return next.handle();
    }
    const authResult = await this.authClient.validateToken(token);
    if (!authResult.isValid) {
      throw new HttpException(
        authResult.error || 'Invalid or expired token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (authResult.userId) {
      request.userId = authResult.userId;
      request.userPermissions = authResult.permissions;
    }
    return next.handle();
  }
} 
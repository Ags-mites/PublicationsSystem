import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  getHello(): object {
    return {
      message: 'Auth Service is running!',
      service: 'auth-service',
      port: process.env.PORT || 3001,
      endpoints: ['/auth/hello', '/auth/validate-token', '/health']
    };
  }

  validateToken(token: string): object {
    try {
      const decoded = this.jwtService.verify(token);
      return {
        valid: true,
        decoded,
        message: 'Token is valid'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        message: 'Invalid token'
      };
    }
  }
}
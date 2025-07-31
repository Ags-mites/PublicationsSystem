import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('hello')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  getHello(): object {
    return this.authService.getHello();
  }

  @Post('validate-token')
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  validateToken(@Body() tokenData: { token: string }): object {
    return this.authService.validateToken(tokenData.token);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for Consul' })
  getHealth(): object {
    return { status: 'healthy', service: 'auth-service', timestamp: new Date() };
  }
}
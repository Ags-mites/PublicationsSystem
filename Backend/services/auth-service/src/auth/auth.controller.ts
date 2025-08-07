import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ConsulDiscoveryService } from '../common/consul-discovery.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly consulDiscoveryService: ConsulDiscoveryService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  // Ejemplo de endpoint que usa Consul para descubrir otros servicios
  @UseGuards(JwtAuthGuard)
  @Get('services-info')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get information about other services using Consul' })
  @ApiResponse({ status: 200, description: 'Services information retrieved' })
  async getServicesInfo() {
    try {
      const services = {
        publications: await this.consulDiscoveryService.discoverService('publications-service'),
        catalog: await this.consulDiscoveryService.discoverService('catalog-service'),
        notifications: await this.consulDiscoveryService.discoverService('notifications-service'),
      };

      return {
        message: 'Services discovered via Consul',
        services,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        message: 'Error discovering services',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
} 
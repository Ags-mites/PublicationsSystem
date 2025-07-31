import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('hello')
  @ApiOperation({ summary: 'Service status endpoint' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  getHello(): object {
    return this.notificationsService.getHello();
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent notifications' })
  @ApiResponse({ status: 200, description: 'List of recent notifications' })
  getRecentNotifications(): object {
    return this.notificationsService.getRecentNotifications();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for Consul' })
  getHealth(): object {
    return { status: 'healthy', service: 'notifications-service', timestamp: new Date() };
  }
}
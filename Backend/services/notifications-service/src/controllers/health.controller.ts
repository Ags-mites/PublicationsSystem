import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';

@ApiTags('Health')
@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async healthCheck() {
    try {
      const startTime = Date.now();

      // Check database connectivity
      const dbHealthy = await this.checkDatabase();
      
      // Check WebSocket gateway
      const gatewayStats = this.notificationsGateway.getGatewayStats();

      const responseTime = Date.now() - startTime;

      const health = {
        status: dbHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: {
            status: dbHealthy ? 'up' : 'down',
          },
          websocket: {
            status: 'up',
            connectedUsers: gatewayStats.connectedUsers,
            totalConnections: gatewayStats.totalConnections,
          },
        },
      };

      return health;

    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Service metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Service metrics and statistics' })
  async getMetrics() {
    try {
      const [
        totalNotifications,
        pendingNotifications,
        sentNotifications,
        failedNotifications,
        totalUsers,
        recentActivity,
      ] = await Promise.all([
        this.prisma.notification.count(),
        this.prisma.notification.count({ where: { status: 'PENDING' } }),
        this.prisma.notification.count({ where: { status: 'SENT' } }),
        this.prisma.notification.count({ where: { status: 'FAILED' } }),
        this.prisma.notificationPreference.count(),
        this.getRecentActivity(),
      ]);

      const gatewayStats = this.notificationsGateway.getGatewayStats();

      return {
        timestamp: new Date().toISOString(),
        notifications: {
          total: totalNotifications,
          pending: pendingNotifications,
          sent: sentNotifications,
          failed: failedNotifications,
          successRate: totalNotifications > 0 
            ? ((sentNotifications / totalNotifications) * 100).toFixed(2) + '%'
            : '0%',
        },
        users: {
          totalRegistered: totalUsers,
          currentlyConnected: gatewayStats.connectedUsers,
          totalConnections: gatewayStats.totalConnections,
        },
        activity: recentActivity,
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
        },
      };

    } catch (error) {
      this.logger.error(`Failed to get metrics: ${error.message}`, error.stack);
      return {
        timestamp: new Date().toISOString(),
        error: 'Failed to retrieve metrics',
      };
    }
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }



  private async getRecentActivity() {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const [recentNotifications, recentDeliveries] = await Promise.all([
        this.prisma.notification.count({
          where: { createdAt: { gte: oneDayAgo } },
        }),
        this.prisma.deliveryLog.count({
          where: { attemptedAt: { gte: oneDayAgo } },
        }),
      ]);

      return {
        last24Hours: {
          notificationsCreated: recentNotifications,
          deliveriesAttempted: recentDeliveries,
        },
      };

    } catch (error) {
      this.logger.error('Failed to get recent activity:', error);
      return { last24Hours: { notificationsCreated: 0, deliveriesAttempted: 0 } };
    }
  }
}
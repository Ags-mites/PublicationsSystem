import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { AuthClientService } from '../services/auth-client.service';
import { AuthToken, UserId, RequiredPermissions } from '../decorators/auth.decorator';

@ApiTags('Admin Notifications')
@Controller('admin/notifications')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private prisma: PrismaService,
    private authClient: AuthClientService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics (requires admin permissions)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getNotificationStats(
    @AuthToken() token: string,
    @RequiredPermissions(['admin:notifications:read']) requiredPermissions: string[],
  ) {
    try {
      if (!token) {
        throw new HttpException('Token is required', HttpStatus.UNAUTHORIZED);
      }

      // Verificar permisos con el microservicio de autenticación
      const authResult = await this.authClient.checkPermissions(token, requiredPermissions);
      
      if (!authResult.isValid) {
        throw new HttpException(
          authResult.error || 'Insufficient permissions',
          HttpStatus.FORBIDDEN,
        );
      }

      // Obtener estadísticas de notificaciones
      const [totalNotifications, pendingNotifications, sentNotifications] = await Promise.all([
        this.prisma.notification.count(),
        this.prisma.notification.count({ where: { status: 'PENDING' } }),
        this.prisma.notification.count({ where: { status: 'SENT' } }),
      ]);

      return {
        totalNotifications,
        pendingNotifications,
        sentNotifications,
        failedNotifications: totalNotifications - pendingNotifications - sentNotifications,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to get notification stats: ${error.message}`, error.stack);
      throw new HttpException('Failed to retrieve statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('bulk')
  @ApiOperation({ summary: 'Delete multiple notifications (requires admin permissions)' })
  @ApiResponse({ status: 200, description: 'Notifications deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async deleteBulkNotifications(
    @AuthToken() token: string,
    @Body() body: { notificationIds: string[] },
    @RequiredPermissions(['admin:notifications:delete']) requiredPermissions: string[],
  ) {
    try {
      if (!token) {
        throw new HttpException('Token is required', HttpStatus.UNAUTHORIZED);
      }

      // Verificar permisos con el microservicio de autenticación
      const authResult = await this.authClient.checkPermissions(token, requiredPermissions);
      
      if (!authResult.isValid) {
        throw new HttpException(
          authResult.error || 'Insufficient permissions',
          HttpStatus.FORBIDDEN,
        );
      }

      const { notificationIds } = body;

      if (!notificationIds || notificationIds.length === 0) {
        throw new HttpException('Notification IDs are required', HttpStatus.BAD_REQUEST);
      }

      // Eliminar notificaciones en lote
      const result = await this.prisma.notification.deleteMany({
        where: {
          id: { in: notificationIds },
        },
      });

      this.logger.log(`Deleted ${result.count} notifications`);

      return {
        message: `Successfully deleted ${result.count} notifications`,
        deletedCount: result.count,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to delete bulk notifications: ${error.message}`, error.stack);
      throw new HttpException('Failed to delete notifications', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('send-test')
  @ApiOperation({ summary: 'Send test notification (requires admin permissions)' })
  @ApiResponse({ status: 200, description: 'Test notification sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async sendTestNotification(
    @AuthToken() token: string,
    @Body() body: { userId: string; message: string },
    @RequiredPermissions(['admin:notifications:send']) requiredPermissions: string[],
  ) {
    try {
      if (!token) {
        throw new HttpException('Token is required', HttpStatus.UNAUTHORIZED);
      }

      // Verificar permisos con el microservicio de autenticación
      const authResult = await this.authClient.checkPermissions(token, requiredPermissions);
      
      if (!authResult.isValid) {
        throw new HttpException(
          authResult.error || 'Insufficient permissions',
          HttpStatus.FORBIDDEN,
        );
      }

      const { userId, message } = body;

      if (!userId || !message) {
        throw new HttpException('User ID and message are required', HttpStatus.BAD_REQUEST);
      }

      // Crear notificación de prueba
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: 'USER_LOGIN',
          title: 'Test Notification',
          message,
          channel: 'WEBSOCKET',
          status: 'PENDING',
        },
      });

      this.logger.log(`Test notification created for user ${userId}`);

      return {
        message: 'Test notification sent successfully',
        notificationId: notification.id,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to send test notification: ${error.message}`, error.stack);
      throw new HttpException('Failed to send test notification', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 
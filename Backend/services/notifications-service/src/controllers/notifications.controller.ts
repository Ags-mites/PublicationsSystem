import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationProcessingService } from '../services/notification-processing.service';
import {
  NotificationDto,
  NotificationQueryDto,
  MarkNotificationReadDto,
} from '../dto';
import { NotificationStatus } from '@prisma/client';

// Mock auth guard - in real implementation, use proper JWT guard
class AuthGuard {
  canActivate(): boolean {
    return true; // Placeholder
  }
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private prisma: PrismaService,
    private notificationProcessingService: NotificationProcessingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiQuery({ name: 'userId', required: true, description: 'User ID to get notifications for' })
  @Throttle(60, 60)
  async getNotifications(@Query() queryDto: NotificationQueryDto) {
    try {
      const {
        userId,
        status,
        type,
        channel,
        page = 1,
        limit = 20,
      } = queryDto;

      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const whereClause: any = { userId };

      if (status) whereClause.status = status;
      if (type) whereClause.type = type;
      if (channel) whereClause.channel = channel;

      const [notifications, totalCount] = await Promise.all([
        this.prisma.notification.findMany({
          where: whereClause,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.notification.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        notifications: notifications.map(this.mapToDto),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to get notifications: ${error.message}`, error.stack);
      throw new HttpException('Failed to retrieve notifications', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications for user' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
  @Throttle(120, 60)
  async getUnreadCount(@Query('userId') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const unreadCount = await this.prisma.notification.count({
        where: {
          userId,
          status: {
            in: [NotificationStatus.PENDING, NotificationStatus.SENT],
          },
        },
      });

      return { unreadCount, userId };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to get unread count: ${error.message}`, error.stack);
      throw new HttpException('Failed to retrieve unread count', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/mark-read')
  @ApiOperation({ summary: 'Mark notification as read or unread' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification status updated successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @Throttle(30, 60)
  async markAsRead(
    @Param('id') id: string,
    @Body() markReadDto: MarkNotificationReadDto,
    @Query('userId') userId: string,
  ) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const { isRead } = markReadDto;

      const updateData: any = {
        status: isRead ? NotificationStatus.READ : NotificationStatus.SENT,
      };

      if (isRead) {
        updateData.readAt = new Date();
      } else {
        updateData.readAt = null;
      }

      const result = await this.prisma.notification.updateMany({
        where: { id, userId },
        data: updateData,
      });

      if (result.count === 0) {
        throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
      }

      return {
        message: `Notification marked as ${isRead ? 'read' : 'unread'} successfully`,
        notificationId: id,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to mark notification as read: ${error.message}`, error.stack);
      throw new HttpException('Failed to update notification status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read successfully' })
  @Throttle(10, 60)
  async markAllAsRead(@Query('userId') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.prisma.notification.updateMany({
        where: {
          userId,
          status: {
            in: [NotificationStatus.PENDING, NotificationStatus.SENT],
          },
        },
        data: {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      });

      return {
        message: 'All notifications marked as read successfully',
        updatedCount: result.count,
        userId,
      };

    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error.message}`, error.stack);
      throw new HttpException('Failed to mark all notifications as read', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @Throttle(30, 60)
  async deleteNotification(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const success = await this.notificationProcessingService.deleteNotification(id, userId);

      if (!success) {
        throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
      }

      return {
        message: 'Notification deleted successfully',
        notificationId: id,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to delete notification: ${error.message}`, error.stack);
      throw new HttpException('Failed to delete notification', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('clear-all')
  @ApiOperation({ summary: 'Clear all read notifications for user' })
  @ApiResponse({ status: 200, description: 'Read notifications cleared successfully' })
  @Throttle(5, 60)
  async clearAllRead(@Query('userId') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.prisma.notification.deleteMany({
        where: {
          userId,
          status: NotificationStatus.READ,
        },
      });

      return {
        message: 'Read notifications cleared successfully',
        deletedCount: result.count,
        userId,
      };

    } catch (error) {
      this.logger.error(`Failed to clear read notifications: ${error.message}`, error.stack);
      throw new HttpException('Failed to clear read notifications', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics for user' })
  @ApiResponse({ status: 200, description: 'Notification statistics retrieved successfully' })
  @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
  @Throttle(10, 60)
  async getNotificationStats(@Query('userId') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const [totalCount, unreadCount, readCount, failedCount] = await Promise.all([
        this.prisma.notification.count({ where: { userId } }),
        this.prisma.notification.count({
          where: { userId, status: { in: [NotificationStatus.PENDING, NotificationStatus.SENT] } },
        }),
        this.prisma.notification.count({
          where: { userId, status: NotificationStatus.READ },
        }),
        this.prisma.notification.count({
          where: { userId, status: NotificationStatus.FAILED },
        }),
      ]);

      const statsByType = await this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { _all: true },
      });

      const statsByChannel = await this.prisma.notification.groupBy({
        by: ['channel'],
        where: { userId },
        _count: { _all: true },
      });

      return {
        userId,
        totalNotifications: totalCount,
        unread: unreadCount,
        read: readCount,
        failed: failedCount,
        byType: statsByType.map(stat => ({
          type: stat.type,
          count: stat._count._all,
        })),
        byChannel: statsByChannel.map(stat => ({
          channel: stat.channel,
          count: stat._count._all,
        })),
      };

    } catch (error) {
      this.logger.error(`Failed to get notification stats: ${error.message}`, error.stack);
      throw new HttpException('Failed to retrieve notification statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private mapToDto(notification: any): NotificationDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      channel: notification.channel,
      status: notification.status,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      sentAt: notification.sentAt,
      readAt: notification.readAt,
      retryCount: notification.retryCount,
      maxRetries: notification.maxRetries,
    };
  }
}
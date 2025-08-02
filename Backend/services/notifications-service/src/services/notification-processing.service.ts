import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { NotificationChannel, NotificationStatus, NotificationType } from '@prisma/client';
import { notificationTemplates } from '../templates/notification-templates';

export interface NotificationEventData {
  eventType: string;
  notificationType: NotificationType;
  targetUsers: string[];
  templateVariables: any;
  metadata?: any;
  priority?: number; // 1=low, 2=normal, 3=high
}

export interface NotificationJobData {
  notificationId: string;
  channel: NotificationChannel;
  userId: string;
  templateVariables: any;
  priority?: number;
}

@Injectable()
export class NotificationProcessingService {
  private readonly logger = new Logger(NotificationProcessingService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async processNotificationEvent(eventData: NotificationEventData): Promise<void> {
    const { eventType, notificationType, targetUsers, templateVariables, metadata, priority = 2 } = eventData;

    try {
      for (const userId of targetUsers) {
        // Get user preferences and subscriptions
        const userChannels = await this.getUserNotificationChannels(userId, eventType);

        if (userChannels.length === 0) {
          this.logger.debug(`No notification channels enabled for user ${userId} and event ${eventType}`);
          continue;
        }

        // Create notifications for each channel
        for (const channel of userChannels) {
          await this.createNotification({
            userId,
            type: notificationType,
            channel,
            eventType,
            templateVariables,
            metadata,
            priority,
          });
        }
      }

      this.logger.log(`Processed notification event ${eventType} for ${targetUsers.length} users`);

    } catch (error) {
      this.logger.error(`Failed to process notification event ${eventType}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async createNotification(data: {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    eventType: string;
    templateVariables: any;
    metadata?: any;
    priority?: number;
  }): Promise<void> {
    try {
      const { title, message } = this.generateNotificationContent(
        data.eventType,
        data.channel,
        data.templateVariables,
      );

      // Create notification record
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title,
          message,
          channel: data.channel,
          status: NotificationStatus.PENDING,
          metadata: data.metadata || {},
          maxRetries: this.getMaxRetries(data.channel),
        },
      });

      // Add to processing queue
      await this.queueNotificationDelivery({
        notificationId: notification.id,
        channel: data.channel,
        userId: data.userId,
        templateVariables: data.templateVariables,
        priority: data.priority || 2,
      });

      this.logger.debug(`Created ${data.channel} notification ${notification.id} for user ${data.userId}`);

    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async queueNotificationDelivery(jobData: NotificationJobData): Promise<void> {
    try {
      const delay = this.calculateDeliveryDelay(jobData.channel, jobData.priority || 1);
      
      await this.notificationQueue.add(
        'deliver-notification',
        jobData,
        {
          priority: jobData.priority || 2,
          delay,
          attempts: this.getMaxRetries(jobData.channel) + 1,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      );

      this.logger.debug(`Queued notification ${jobData.notificationId} for delivery via ${jobData.channel}`);

    } catch (error) {
      this.logger.error(`Failed to queue notification delivery: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deliverNotification(jobData: NotificationJobData): Promise<void> {
    const { notificationId, channel, userId, templateVariables } = jobData;

    try {
      // Get notification record
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      if (notification.status === NotificationStatus.SENT || notification.status === NotificationStatus.READ) {
        this.logger.debug(`Notification ${notificationId} already processed`);
        return;
      }

      // Check if user is in quiet hours
      if (await this.isInQuietHours(userId)) {
        this.logger.debug(`User ${userId} is in quiet hours, rescheduling notification`);
        await this.rescheduleNotification(notificationId);
        return;
      }

      let deliverySuccess = false;

      // Deliver based on channel
      switch (channel) {
        case NotificationChannel.EMAIL:
          deliverySuccess = await this.deliverEmailNotification(notification, templateVariables);
          break;

        case NotificationChannel.WEBSOCKET:
          deliverySuccess = await this.deliverWebSocketNotification(notification);
          break;

        case NotificationChannel.PUSH:
          deliverySuccess = await this.deliverPushNotification(notification);
          break;

        default:
          throw new Error(`Unsupported notification channel: ${channel}`);
      }

      // Update notification status
      await this.updateNotificationStatus(notificationId, deliverySuccess);

      // Log delivery
      await this.logDeliveryAttempt(notificationId, channel, deliverySuccess);

      this.logger.log(`Notification ${notificationId} delivered via ${channel}: ${deliverySuccess ? 'success' : 'failed'}`);

    } catch (error) {
      this.logger.error(`Failed to deliver notification ${notificationId}: ${error.message}`, error.stack);
      
      // Update retry count
      await this.incrementRetryCount(notificationId);
      
      // Log failed delivery
      await this.logDeliveryAttempt(notificationId, channel, false, error.message);
      
      throw error;
    }
  }

  private async deliverEmailNotification(notification: any, templateVariables: any): Promise<boolean> {
    try {
      // Email service disabled - simulate successful delivery for WebSocket/Push notifications only
      this.logger.log(`Email delivery simulated for notification ${notification.id} to user ${notification.userId}`);
      return true;

    } catch (error) {
      this.logger.error(`Email delivery failed: ${error.message}`);
      return false;
    }
  }

  private async deliverWebSocketNotification(notification: any): Promise<boolean> {
    try {
      await this.notificationsGateway.sendNotificationToUser(notification.userId, notification);
      return true;

    } catch (error) {
      this.logger.error(`WebSocket delivery failed: ${error.message}`);
      return false;
    }
  }

  private async deliverPushNotification(notification: any): Promise<boolean> {
    try {
      // Placeholder for push notification implementation
      this.logger.debug(`Push notification delivery not implemented yet for notification ${notification.id}`);
      return false;

    } catch (error) {
      this.logger.error(`Push delivery failed: ${error.message}`);
      return false;
    }
  }

  private async getUserNotificationChannels(userId: string, eventType: string): Promise<NotificationChannel[]> {
    try {
      // Get user preferences
      const preferences = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!preferences) {
        // Return default channels if no preferences set
        return [NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET];
      }

      const channels: NotificationChannel[] = [];

      // Check subscription for this event type
      const subscription = await this.prisma.notificationSubscription.findUnique({
        where: { userId_eventType: { userId, eventType } },
      });

      if (subscription && subscription.isActive) {
        channels.push(subscription.channelPreference);
      } else {
        // Use default channels based on preferences
        if (preferences.emailEnabled) channels.push(NotificationChannel.EMAIL);
        if (preferences.websocketEnabled) channels.push(NotificationChannel.WEBSOCKET);
        if (preferences.pushEnabled) channels.push(NotificationChannel.PUSH);
      }

      return channels;

    } catch (error) {
      this.logger.error(`Failed to get user notification channels: ${error.message}`);
      return [NotificationChannel.WEBSOCKET]; // Fallback to WebSocket only
    }
  }

  private generateNotificationContent(eventType: string, channel: NotificationChannel, variables: any): { title: string; message: string } {
    try {
      const template = notificationTemplates[eventType]?.[channel.toLowerCase()];
      
      if (!template) {
        // Fallback to basic template
        return {
          title: 'Notification',
          message: `You have a new ${eventType} notification`,
        };
      }

      // Simple template replacement (in production, use a proper template engine)
      let title = template.subject || template.html;
      let message = template.text || template.html;

      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        title = title.replace(regex, variables[key] || '');
        message = message.replace(regex, variables[key] || '');
      });

      return { title, message };

    } catch (error) {
      this.logger.error(`Failed to generate notification content: ${error.message}`);
      return {
        title: 'Notification',
        message: 'You have a new notification',
      };
    }
  }

  private async updateNotificationStatus(notificationId: string, success: boolean): Promise<void> {
    const status = success ? NotificationStatus.SENT : NotificationStatus.FAILED;
    const updateData: any = { status };

    if (success) {
      updateData.sentAt = new Date();
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: updateData,
    });
  }

  private async incrementRetryCount(notificationId: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { retryCount: { increment: 1 } },
    });
  }

  private async logDeliveryAttempt(
    notificationId: string,
    channel: NotificationChannel,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.deliveryLog.create({
      data: {
        notificationId,
        channel,
        status: success ? 'sent' : 'failed',
        errorMessage,
        deliveredAt: success ? new Date() : null,
      },
    });
  }

  private async isInQuietHours(userId: string): Promise<boolean> {
    try {
      const preferences = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!preferences || !preferences.quietHoursStart || !preferences.quietHoursEnd) {
        return false;
      }

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      return currentTime >= preferences.quietHoursStart && currentTime <= preferences.quietHoursEnd;

    } catch (error) {
      this.logger.error(`Failed to check quiet hours: ${error.message}`);
      return false;
    }
  }

  private async rescheduleNotification(notificationId: string): Promise<void> {
    // Reschedule for next day outside quiet hours
    const delay = 24 * 60 * 60 * 1000; // 24 hours
    
    await this.notificationQueue.add(
      'deliver-notification',
      { notificationId },
      { delay },
    );
  }

  private calculateDeliveryDelay(channel: NotificationChannel, priority: number): number {
    // Immediate delivery for high priority WebSocket notifications
    if (channel === NotificationChannel.WEBSOCKET && priority >= 3) {
      return 0;
    }

    // Small delay for other channels to allow batching
    return channel === NotificationChannel.EMAIL ? 5000 : 1000;
  }

  private getMaxRetries(channel: NotificationChannel): number {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return 3;
      case NotificationChannel.WEBSOCKET:
        return 1;
      case NotificationChannel.PUSH:
        return 2;
      default:
        return 1;
    }
  }

  private async getUserEmail(userId: string): Promise<string | null> {
    // In a real implementation, this would fetch from user service or cache
    // For now, return a placeholder
    return `user${userId}@example.com`;
  }

  private getEventTypeFromNotificationType(type: NotificationType): string {
    const mapping: Record<NotificationType, string> = {
      [NotificationType.USER_REGISTERED]: 'user.registered',
      [NotificationType.USER_LOGIN]: 'user.login',
      [NotificationType.PUBLICATION_SUBMITTED]: 'publication.submitted',
      [NotificationType.PUBLICATION_APPROVED]: 'publication.approved',
      [NotificationType.PUBLICATION_PUBLISHED]: 'publication.published',
      [NotificationType.REVIEW_REQUESTED]: 'review.requested',
      [NotificationType.REVIEW_COMPLETED]: 'review.completed',
      [NotificationType.CHANGES_REQUESTED]: 'changes.requested',
    };

    return mapping[type] || 'unknown';
  }

  // Public methods for API

  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { 
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      });

      return result.count > 0;

    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`);
      return false;
    }
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: { id: notificationId, userId },
      });

      return result.count > 0;

    } catch (error) {
      this.logger.error(`Failed to delete notification: ${error.message}`);
      return false;
    }
  }
}
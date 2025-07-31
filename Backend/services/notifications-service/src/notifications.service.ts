import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private notifications = [
    { id: 1, message: 'New publication submitted', type: 'info', timestamp: new Date() },
    { id: 2, message: 'Review completed', type: 'success', timestamp: new Date() },
    { id: 3, message: 'Publication approved', type: 'success', timestamp: new Date() },
  ];

  getHello(): object {
    return {
      message: 'Notifications Service is running!',
      service: 'notifications-service',
      port: process.env.PORT || 3004,
      endpoints: ['/notifications/hello', '/notifications/recent', '/health']
    };
  }

  getRecentNotifications(): object {
    return {
      notifications: this.notifications,
      total: this.notifications.length,
      message: 'Recent notifications retrieved'
    };
  }
}
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { NotificationDto } from '../dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

interface SubscriptionPayload {
  userId: string;
  token?: string; // JWT token for authentication
}

interface NotificationPayload {
  userId: string;
  notification: NotificationDto;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(private configService: ConfigService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.removeClientFromUserSockets(client);
  }

  @SubscribeMessage('subscribe')
  handleSubscription(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SubscriptionPayload,
  ): void {
    try {
      // In a real implementation, you would validate the JWT token here
      // For now, we'll trust the userId from the payload
      const { userId } = payload;

      if (!userId) {
        client.emit('error', { message: 'User ID is required' });
        return;
      }

      // Store user information in socket
      client.userId = userId;
      
      // Join user-specific room
      client.join(`user:${userId}`);
      
      // Track socket for this user
      this.addClientToUserSockets(userId, client.id);

      client.emit('subscribed', {
        message: 'Successfully subscribed to notifications',
        userId,
      });

      this.logger.log(`User ${userId} subscribed with socket ${client.id}`);

    } catch (error) {
      this.logger.error(`Subscription error: ${error.message}`, error.stack);
      client.emit('error', { message: 'Subscription failed' });
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscription(@ConnectedSocket() client: AuthenticatedSocket): void {
    if (client.userId) {
      client.leave(`user:${client.userId}`);
      this.removeClientFromUserSockets(client);
      
      client.emit('unsubscribed', {
        message: 'Successfully unsubscribed from notifications',
      });

      this.logger.log(`User ${client.userId} unsubscribed socket ${client.id}`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('markAsRead')
  handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { notificationId: string },
  ): void {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Emit to all user's connected clients
    this.server
      .to(`user:${client.userId}`)
      .emit('notificationRead', {
        notificationId: payload.notificationId,
        userId: client.userId,
      });

    this.logger.log(
      `Notification ${payload.notificationId} marked as read by user ${client.userId}`,
    );
  }

  // Public methods for sending notifications

  async sendNotificationToUser(userId: string, notification: NotificationDto): Promise<void> {
    try {
      const userRoom = `user:${userId}`;
      const connectedSockets = await this.server.in(userRoom).fetchSockets();

      if (connectedSockets.length === 0) {
        this.logger.debug(`No active connections for user ${userId}`);
        return;
      }

      this.server.to(userRoom).emit('notification', {
        type: 'new_notification',
        data: notification,
      });

      this.logger.log(
        `Real-time notification sent to user ${userId} (${connectedSockets.length} connections)`,
      );

    } catch (error) {
      this.logger.error(
        `Failed to send real-time notification to user ${userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendBulkNotifications(notifications: NotificationPayload[]): Promise<void> {
    try {
      const promises = notifications.map(({ userId, notification }) =>
        this.sendNotificationToUser(userId, notification),
      );

      await Promise.allSettled(promises);
      this.logger.log(`Bulk notifications sent to ${notifications.length} users`);

    } catch (error) {
      this.logger.error(`Failed to send bulk notifications: ${error.message}`, error.stack);
    }
  }

  async broadcastToAllUsers(message: any): Promise<void> {
    try {
      this.server.emit('broadcast', {
        type: 'system_message',
        data: message,
        timestamp: new Date().toISOString(),
      });

      this.logger.log('Broadcast message sent to all connected users');

    } catch (error) {
      this.logger.error(`Failed to broadcast message: ${error.message}`, error.stack);
    }
  }

  async getUserConnectionCount(userId: string): Promise<number> {
    try {
      const userRoom = `user:${userId}`;
      const connectedSockets = await this.server.in(userRoom).fetchSockets();
      return connectedSockets.length;

    } catch (error) {
      this.logger.error(`Failed to get connection count for user ${userId}: ${error.message}`);
      return 0;
    }
  }

  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  getTotalConnectionsCount(): number {
    let total = 0;
    this.userSockets.forEach(sockets => {
      total += sockets.size;
    });
    return total;
  }

  // Private helper methods

  private addClientToUserSockets(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private removeClientFromUserSockets(client: AuthenticatedSocket): void {
    if (client.userId) {
      const userSockets = this.userSockets.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
    }
  }

  // Health check methods

  getGatewayStats(): any {
    return {
      connectedUsers: this.getConnectedUsersCount(),
      totalConnections: this.getTotalConnectionsCount(),
      timestamp: new Date().toISOString(),
    };
  }
}
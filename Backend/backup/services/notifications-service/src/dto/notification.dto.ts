import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID for the notification' })
  @IsUUID()
  userId: string;
  @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
  @IsEnum(NotificationType)
  type: NotificationType;
  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;
  @ApiProperty({ description: 'Notification message' })
  @IsString()
  message: string;
  @ApiProperty({ enum: NotificationChannel, description: 'Delivery channel' })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;
  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object' })
  @IsOptional()
  metadata?: any;
  @ApiPropertyOptional({ description: 'Maximum retry attempts', default: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  maxRetries?: number = 3;
}
export class NotificationDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;
  @ApiProperty({ description: 'User ID' })
  userId: string;
  @ApiProperty({ enum: NotificationType, description: 'Notification type' })
  type: NotificationType;
  @ApiProperty({ description: 'Notification title' })
  title: string;
  @ApiProperty({ description: 'Notification message' })
  message: string;
  @ApiProperty({ enum: NotificationChannel, description: 'Delivery channel' })
  channel: NotificationChannel;
  @ApiProperty({ enum: NotificationStatus, description: 'Notification status' })
  status: NotificationStatus;
  @ApiProperty({ description: 'Additional metadata', type: 'object' })
  metadata: any;
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
  @ApiPropertyOptional({ description: 'Sent timestamp' })
  sentAt?: Date;
  @ApiPropertyOptional({ description: 'Read timestamp' })
  readAt?: Date;
  @ApiProperty({ description: 'Current retry count' })
  retryCount: number;
  @ApiProperty({ description: 'Maximum retry attempts' })
  maxRetries: number;
}
export class NotificationQueryDto {
  @ApiPropertyOptional({ description: 'User ID filter' })
  @IsOptional()
  @IsUUID()
  userId?: string;
  @ApiPropertyOptional({ enum: NotificationStatus, description: 'Status filter' })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
  @ApiPropertyOptional({ enum: NotificationType, description: 'Type filter' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Channel filter' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;
  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;
  @ApiPropertyOptional({ default: 20, description: 'Items per page' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
export class MarkNotificationReadDto {
  @ApiProperty({ description: 'Mark as read or unread' })
  @IsBoolean()
  isRead: boolean;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { NotificationChannel } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'User ID for the subscription' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Event type to subscribe to' })
  @IsString()
  eventType: string;

  @ApiProperty({ enum: NotificationChannel, description: 'Preferred notification channel' })
  @IsEnum(NotificationChannel)
  channelPreference: NotificationChannel;

  @ApiPropertyOptional({ description: 'Whether subscription is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Preferred notification channel' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channelPreference?: NotificationChannel;

  @ApiPropertyOptional({ description: 'Whether subscription is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SubscriptionDto {
  @ApiProperty({ description: 'Subscription ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Event type' })
  eventType: string;

  @ApiProperty({ enum: NotificationChannel, description: 'Channel preference' })
  channelPreference: NotificationChannel;

  @ApiProperty({ description: 'Whether subscription is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
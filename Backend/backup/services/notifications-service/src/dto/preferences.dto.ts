import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsEnum, Matches } from 'class-validator';
export enum DigestFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}
export class UpdatePreferencesDto {
  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;
  @ApiPropertyOptional({ description: 'Enable WebSocket notifications' })
  @IsOptional()
  @IsBoolean()
  websocketEnabled?: boolean;
  @ApiPropertyOptional({ description: 'Enable push notifications' })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;
  @ApiPropertyOptional({ description: 'Enable email digest' })
  @IsOptional()
  @IsBoolean()
  emailDigestEnabled?: boolean;
  @ApiPropertyOptional({ enum: DigestFrequency, description: 'Digest frequency' })
  @IsOptional()
  @IsEnum(DigestFrequency)
  digestFrequency?: DigestFrequency;
  @ApiPropertyOptional({ description: 'Quiet hours start time (HH:mm format)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:mm format' })
  quietHoursStart?: string;
  @ApiPropertyOptional({ description: 'Quiet hours end time (HH:mm format)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:mm format' })
  quietHoursEnd?: string;
  @ApiPropertyOptional({ description: 'User timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
export class PreferencesDto {
  @ApiProperty({ description: 'Preference ID' })
  id: string;
  @ApiProperty({ description: 'User ID' })
  userId: string;
  @ApiProperty({ description: 'Email notifications enabled' })
  emailEnabled: boolean;
  @ApiProperty({ description: 'WebSocket notifications enabled' })
  websocketEnabled: boolean;
  @ApiProperty({ description: 'Push notifications enabled' })
  pushEnabled: boolean;
  @ApiProperty({ description: 'Email digest enabled' })
  emailDigestEnabled: boolean;
  @ApiProperty({ enum: DigestFrequency, description: 'Digest frequency' })
  digestFrequency: string;
  @ApiPropertyOptional({ description: 'Quiet hours start time' })
  quietHoursStart?: string;
  @ApiPropertyOptional({ description: 'Quiet hours end time' })
  quietHoursEnd?: string;
  @ApiProperty({ description: 'User timezone' })
  timezone: string;
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
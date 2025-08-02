import {
  Controller,
  Get,
  Put,
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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto, PreferencesDto } from '../dto';

// Mock auth guard - in real implementation, use proper JWT guard
class AuthGuard {
  canActivate(): boolean {
    return true; // Placeholder
  }
}

@ApiTags('Notification Preferences')
@Controller('notifications/preferences')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PreferencesController {
  private readonly logger = new Logger(PreferencesController.name);

  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully', type: PreferencesDto })
  @ApiResponse({ status: 404, description: 'Preferences not found' })
  @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
  @Throttle(30, 60)
  async getPreferences(@Query('userId') userId: string): Promise<PreferencesDto> {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      let preferences = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await this.prisma.notificationPreference.create({
          data: {
            userId,
            emailEnabled: true,
            websocketEnabled: true,
            pushEnabled: false,
            emailDigestEnabled: false,
            digestFrequency: 'daily',
            timezone: 'UTC',
          },
        });
      }

      return this.mapToDto(preferences);

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to get preferences: ${error.message}`, error.stack);
      throw new HttpException('Failed to retrieve preferences', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put()
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully', type: PreferencesDto })
  @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
  @Throttle(10, 60)
  async updatePreferences(
    @Query('userId') userId: string,
    @Body() updateDto: UpdatePreferencesDto,
  ): Promise<PreferencesDto> {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      // Validate quiet hours if provided
      if (updateDto.quietHoursStart && updateDto.quietHoursEnd) {
        if (!this.validateTimeFormat(updateDto.quietHoursStart) || 
            !this.validateTimeFormat(updateDto.quietHoursEnd)) {
          throw new HttpException('Invalid time format. Use HH:mm format', HttpStatus.BAD_REQUEST);
        }
      }

      const preferences = await this.prisma.notificationPreference.upsert({
        where: { userId },
        create: {
          userId,
          emailEnabled: updateDto.emailEnabled ?? true,
          websocketEnabled: updateDto.websocketEnabled ?? true,
          pushEnabled: updateDto.pushEnabled ?? false,
          emailDigestEnabled: updateDto.emailDigestEnabled ?? false,
          digestFrequency: updateDto.digestFrequency ?? 'daily',
          quietHoursStart: updateDto.quietHoursStart,
          quietHoursEnd: updateDto.quietHoursEnd,
          timezone: updateDto.timezone ?? 'UTC',
        },
        update: {
          ...(updateDto.emailEnabled !== undefined && { emailEnabled: updateDto.emailEnabled }),
          ...(updateDto.websocketEnabled !== undefined && { websocketEnabled: updateDto.websocketEnabled }),
          ...(updateDto.pushEnabled !== undefined && { pushEnabled: updateDto.pushEnabled }),
          ...(updateDto.emailDigestEnabled !== undefined && { emailDigestEnabled: updateDto.emailDigestEnabled }),
          ...(updateDto.digestFrequency !== undefined && { digestFrequency: updateDto.digestFrequency }),
          ...(updateDto.quietHoursStart !== undefined && { quietHoursStart: updateDto.quietHoursStart }),
          ...(updateDto.quietHoursEnd !== undefined && { quietHoursEnd: updateDto.quietHoursEnd }),
          ...(updateDto.timezone !== undefined && { timezone: updateDto.timezone }),
        },
      });

      this.logger.log(`Updated notification preferences for user ${userId}`);
      return this.mapToDto(preferences);

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to update preferences: ${error.message}`, error.stack);
      throw new HttpException('Failed to update preferences', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('defaults')
  @ApiOperation({ summary: 'Get default notification preferences' })
  @ApiResponse({ status: 200, description: 'Default preferences retrieved successfully' })
  @Throttle(60, 60)
  async getDefaultPreferences(): Promise<Partial<PreferencesDto>> {
    return {
      emailEnabled: true,
      websocketEnabled: true,
      pushEnabled: false,
      emailDigestEnabled: false,
      digestFrequency: 'daily',
      timezone: 'UTC',
    };
  }

  private validateTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  private mapToDto(preferences: any): PreferencesDto {
    return {
      id: preferences.id,
      userId: preferences.userId,
      emailEnabled: preferences.emailEnabled,
      websocketEnabled: preferences.websocketEnabled,
      pushEnabled: preferences.pushEnabled,
      emailDigestEnabled: preferences.emailDigestEnabled,
      digestFrequency: preferences.digestFrequency,
      quietHoursStart: preferences.quietHoursStart,
      quietHoursEnd: preferences.quietHoursEnd,
      timezone: preferences.timezone,
      createdAt: preferences.createdAt,
      updatedAt: preferences.updatedAt,
    };
  }
}
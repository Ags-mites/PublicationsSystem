import {
  Controller,
  Get,
  Post,
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
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionDto,
} from '../dto';
@ApiTags('Notification Subscriptions')
@Controller('notifications/subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);
  constructor(private prisma: PrismaService) {}
  @Get()
  @ApiOperation({ summary: 'Get user notification subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
  @Throttle(30, 60)
  async getSubscriptions(@Query('userId') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }
      const subscriptions = await this.prisma.notificationSubscription.findMany({
        where: { userId },
        orderBy: { eventType: 'asc' },
      });
      return {
        subscriptions: subscriptions.map(this.mapToDto),
        userId,
        totalCount: subscriptions.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get subscriptions: ${error.message}`, error.stack);
      throw new HttpException('Failed to retrieve subscriptions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Post()
  @ApiOperation({ summary: 'Create a new notification subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully', type: SubscriptionDto })
  @ApiResponse({ status: 409, description: 'Subscription already exists' })
  @Throttle(10, 60)
  async createSubscription(@Body() createDto: CreateSubscriptionDto): Promise<SubscriptionDto> {
    try {
      const existingSubscription = await this.prisma.notificationSubscription.findUnique({
        where: {
          userId_eventType: {
            userId: createDto.userId,
            eventType: createDto.eventType,
          },
        },
      });
      if (existingSubscription) {
        throw new HttpException(
          'Subscription already exists for this event type',
          HttpStatus.CONFLICT,
        );
      }
      const subscription = await this.prisma.notificationSubscription.create({
        data: {
          userId: createDto.userId,
          eventType: createDto.eventType,
          channelPreference: createDto.channelPreference,
          isActive: createDto.isActive ?? true,
        },
      });
      this.logger.log(
        `Created subscription for user ${createDto.userId}, event ${createDto.eventType}`,
      );
      return this.mapToDto(subscription);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to create subscription: ${error.message}`, error.stack);
      throw new HttpException('Failed to create subscription', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Put(':id')
  @ApiOperation({ summary: 'Update notification subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully', type: SubscriptionDto })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Throttle(20, 60)
  async updateSubscription(
    @Param('id') id: string,
    @Query('userId') userId: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionDto> {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }
      const existingSubscription = await this.prisma.notificationSubscription.findFirst({
        where: { id, userId },
      });
      if (!existingSubscription) {
        throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
      }
      const subscription = await this.prisma.notificationSubscription.update({
        where: { id },
        data: {
          ...(updateDto.channelPreference !== undefined && { 
            channelPreference: updateDto.channelPreference 
          }),
          ...(updateDto.isActive !== undefined && { isActive: updateDto.isActive }),
        },
      });
      this.logger.log(`Updated subscription ${id} for user ${userId}`);
      return this.mapToDto(subscription);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to update subscription: ${error.message}`, error.stack);
      throw new HttpException('Failed to update subscription', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Throttle(10, 60)
  async deleteSubscription(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }
      const result = await this.prisma.notificationSubscription.deleteMany({
        where: { id, userId },
      });
      if (result.count === 0) {
        throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
      }
      this.logger.log(`Deleted subscription ${id} for user ${userId}`);
      return {
        message: 'Subscription deleted successfully',
        subscriptionId: id,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to delete subscription: ${error.message}`, error.stack);
      throw new HttpException('Failed to delete subscription', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Get('event-types')
  @ApiOperation({ summary: 'Get available event types for subscriptions' })
  @ApiResponse({ status: 200, description: 'Event types retrieved successfully' })
  @Throttle(60, 60)
  async getAvailableEventTypes() {
    const eventTypes = [
      {
        eventType: 'user.registered',
        description: 'User registration notifications',
        defaultChannel: 'EMAIL',
      },
      {
        eventType: 'user.login',
        description: 'Login alert notifications',
        defaultChannel: 'EMAIL',
      },
      {
        eventType: 'publication.submitted',
        description: 'Publication submission confirmations',
        defaultChannel: 'EMAIL',
      },
      {
        eventType: 'publication.approved',
        description: 'Publication approval notifications',
        defaultChannel: 'EMAIL',
      },
      {
        eventType: 'publication.published',
        description: 'Publication publishing notifications',
        defaultChannel: 'EMAIL',
      },
      {
        eventType: 'review.requested',
        description: 'Review request notifications',
        defaultChannel: 'EMAIL',
      },
      {
        eventType: 'review.completed',
        description: 'Review completion notifications',
        defaultChannel: 'EMAIL',
      },
    ];
    return {
      eventTypes,
      totalCount: eventTypes.length,
    };
  }
  @Post('bulk-create')
  @ApiOperation({ summary: 'Create multiple subscriptions at once' })
  @ApiResponse({ status: 201, description: 'Subscriptions created successfully' })
  @Throttle(5, 60)
  async createBulkSubscriptions(
    @Body() subscriptions: CreateSubscriptionDto[],
    @Query('userId') userId: string,
  ) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }
      const invalidSubscriptions = subscriptions.filter(sub => sub.userId !== userId);
      if (invalidSubscriptions.length > 0) {
        throw new HttpException('All subscriptions must belong to the authenticated user', HttpStatus.BAD_REQUEST);
      }
      const createdSubscriptions: any[] = [];
      const errors: any[] = [];
      for (const subscriptionData of subscriptions) {
        try {
          const subscription = await this.prisma.notificationSubscription.upsert({
            where: {
              userId_eventType: {
                userId: subscriptionData.userId,
                eventType: subscriptionData.eventType,
              },
            },
            create: {
              userId: subscriptionData.userId,
              eventType: subscriptionData.eventType,
              channelPreference: subscriptionData.channelPreference,
              isActive: subscriptionData.isActive ?? true,
            },
            update: {
              channelPreference: subscriptionData.channelPreference,
              isActive: subscriptionData.isActive ?? true,
            },
          });
          createdSubscriptions.push(this.mapToDto(subscription));
        } catch (error) {
          errors.push({
            eventType: subscriptionData.eventType,
            error: error.message,
          });
        }
      }
      this.logger.log(
        `Bulk created ${createdSubscriptions.length} subscriptions for user ${userId}`,
      );
      return {
        success: createdSubscriptions.length,
        errors: errors.length,
        subscriptions: createdSubscriptions,
        errorDetails: errors,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to create bulk subscriptions: ${error.message}`, error.stack);
      throw new HttpException('Failed to create bulk subscriptions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  private mapToDto(subscription: any): SubscriptionDto {
    return {
      id: subscription.id,
      userId: subscription.userId,
      eventType: subscription.eventType,
      channelPreference: subscription.channelPreference,
      isActive: subscription.isActive,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
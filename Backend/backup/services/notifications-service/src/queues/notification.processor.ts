import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationProcessingService, NotificationJobData } from '../services/notification-processing.service';
@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);
  constructor(
    private notificationProcessingService: NotificationProcessingService,
  ) {}
  @Process('deliver-notification')
  async handleNotificationDelivery(job: Job<NotificationJobData>): Promise<void> {
    const { notificationId, channel } = job.data;
    this.logger.log(`Processing notification delivery job: ${notificationId} via ${channel}`);
    try {
      await this.notificationProcessingService.deliverNotification(job.data);
      this.logger.log(`Successfully delivered notification: ${notificationId}`);
    } catch (error) {
      this.logger.error(
        `Failed to deliver notification ${notificationId}: ${error.message}`,
        error.stack,
      );
      throw error; 
    }
  }
  @Process('send-digest')
  async handleDigestDelivery(job: Job): Promise<void> {
    const { userId, frequency } = job.data;
    this.logger.log(`Processing digest delivery for user: ${userId}, frequency: ${frequency}`);
    try {
      this.logger.log(`Successfully sent digest to user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send digest to user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
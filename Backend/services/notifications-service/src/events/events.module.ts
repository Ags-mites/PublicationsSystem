import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationEventsConsumer } from './notification-events.consumer';
import { NotificationProcessingService } from '../services/notification-processing.service';
import { EventPublisherService } from '../services/event-publisher.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [
    NotificationEventsConsumer,
    NotificationProcessingService,
    EventPublisherService,
    NotificationsGateway,
  ],
  exports: [
    NotificationEventsConsumer,
    NotificationProcessingService,
    EventPublisherService,
    NotificationsGateway,
  ],
})
export class EventsModule {}
import { Module } from '@nestjs/common';
import { EventPublisherService } from './services/event-publisher.service';

@Module({
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventsModule {}
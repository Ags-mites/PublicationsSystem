import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventPublisherService } from './event-publisher.service';
import { OutboxModule } from './outbox/outbox.module';

@Module({
  imports: [ConfigModule, OutboxModule],
  providers: [EventPublisherService],
  exports: [EventPublisherService, OutboxModule],
})
export class EventsModule {}
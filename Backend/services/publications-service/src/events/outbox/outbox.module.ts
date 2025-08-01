import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OutboxService } from './outbox.service';
import { OutboxRepository } from './outbox.repository';
import { OutboxProcessorService } from './outbox-processor.service';
import { RabbitMQPublisherService } from './rabbitmq-publisher.service';

@Module({
  imports: [ConfigModule],
  providers: [
    OutboxService,
    OutboxRepository,
    OutboxProcessorService,
    RabbitMQPublisherService,
  ],
  exports: [OutboxService],
})
export class OutboxModule {}
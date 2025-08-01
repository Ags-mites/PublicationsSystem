import { Module } from '@nestjs/common';
import { PublicationsController } from './controllers/publications.controller';
import { PublicationsService } from './services/publications.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [PublicationsController],
  providers: [PublicationsService],
  exports: [PublicationsService],
})
export class PublicationsModule {}
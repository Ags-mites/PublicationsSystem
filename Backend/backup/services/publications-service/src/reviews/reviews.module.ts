import { Module } from '@nestjs/common';
import { ReviewsController } from './controllers/reviews.controller';
import { ReviewsService } from './services/reviews.service';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';
@Module({
  imports: [DatabaseModule, EventsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
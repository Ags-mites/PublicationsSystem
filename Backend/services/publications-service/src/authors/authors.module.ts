import { Module } from '@nestjs/common';
import { AuthorsController } from './controllers/authors.controller';
import { AuthorsService } from './services/authors.service';
import { AuthorsRepository } from './repositories/authors.repository';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [DatabaseModule, EventsModule],
  controllers: [AuthorsController],
  providers: [AuthorsService, AuthorsRepository],
  exports: [AuthorsService, AuthorsRepository],
})
export class AuthorsModule {}

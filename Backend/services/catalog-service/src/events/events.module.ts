import { Module } from '@nestjs/common';
import { PublicationEventsConsumer } from './publication-events.consumer';
import { CatalogService } from '../services/catalog.service';
import { CatalogAuthorService } from '../services/catalog-author.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    PublicationEventsConsumer,
    CatalogService,
    CatalogAuthorService,
  ],
  exports: [
    PublicationEventsConsumer,
    CatalogService,
    CatalogAuthorService,
  ],
})
export class EventsModule {}
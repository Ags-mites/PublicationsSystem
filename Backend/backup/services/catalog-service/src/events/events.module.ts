import { Module } from '@nestjs/common';
import { PublicationEventsConsumer } from './publication-events.consumer';
import { CatalogService } from '../modules/catalog/services/catalog.service';
import { CatalogAuthorService } from '../modules/authors/services/catalog-author.service';
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
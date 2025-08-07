import { Module } from '@nestjs/common';
import { CatalogController } from './controllers/catalog.controller';
import { CatalogService } from './services/catalog.service';
import { CatalogSearchService } from './services/catalog-search.service';
import { MetricsService } from '../../common/metrics.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthorsModule } from '../authors/authors.module';

@Module({
  imports: [PrismaModule, AuthorsModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogSearchService, MetricsService],
  exports: [CatalogService, CatalogSearchService],
})
export class CatalogModule {}

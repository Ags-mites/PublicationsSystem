import { Module } from '@nestjs/common';
import { AuthorsController } from './controllers/authors.controller';
import { CatalogAuthorService } from './services/catalog-author.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthorsController],
  providers: [CatalogAuthorService],
  exports: [CatalogAuthorService],
})
export class AuthorsModule {}

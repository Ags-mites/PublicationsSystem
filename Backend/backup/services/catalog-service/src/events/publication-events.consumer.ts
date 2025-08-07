import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CatalogService } from '../modules/catalog/services/catalog.service';
import { 
  PublicationPublishedEvent, 
  PublicationWithdrawnEvent,
  AuthorCreatedEvent,
  AuthorUpdatedEvent 
} from '../common/events.interface';
@Injectable()
export class PublicationEventsConsumer {
  private readonly logger = new Logger(PublicationEventsConsumer.name);
  constructor(private catalogService: CatalogService) {}
  @EventPattern('publication.published')
  async handlePublicationPublished(@Payload() data: PublicationPublishedEvent): Promise<void> {
    const startTime = Date.now();
    try {
      this.logger.log(`Processing publication.published event for publication ${data.publicationId}`);
      await this.catalogService.indexPublication(data);
      if (data.primaryAuthorId) {
        await this.catalogService.updateAuthorStatistics(data.primaryAuthorId);
      }
      const executionTime = Date.now() - startTime;
      this.logger.log(
        `Publication ${data.publicationId} indexed successfully in ${executionTime}ms`
      );
    } catch (error) {
      this.logger.error(
        `Failed to process publication.published event for ${data.publicationId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  @EventPattern('publication.withdrawn')
  async handlePublicationWithdrawn(@Payload() data: PublicationWithdrawnEvent): Promise<void> {
    try {
      this.logger.log(`Processing publication.withdrawn event for publication ${data.publicationId}`);
      await this.catalogService.withdrawPublication(data);
      this.logger.log(`Publication ${data.publicationId} withdrawn from catalog`);
    } catch (error) {
      this.logger.error(
        `Failed to process publication.withdrawn event for ${data.publicationId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  @EventPattern('publication.updated')
  async handlePublicationUpdated(@Payload() data: PublicationPublishedEvent): Promise<void> {
    try {
      this.logger.log(`Processing publication.updated event for publication ${data.publicationId}`);
      await this.catalogService.indexPublication(data);
      this.logger.log(`Publication ${data.publicationId} updated in catalog`);
    } catch (error) {
      this.logger.error(
        `Failed to process publication.updated event for ${data.publicationId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  @EventPattern('author.created')
  async handleAuthorCreated(@Payload() data: AuthorCreatedEvent): Promise<void> {
    try {
      this.logger.log(`Processing author.created event for author ${data.authorId}`);
      await this.catalogService.handleAuthorCreated(data);
      this.logger.log(`Author ${data.authorId} created in catalog`);
    } catch (error) {
      this.logger.error(
        `Failed to process author.created event for ${data.authorId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  @EventPattern('author.updated')
  async handleAuthorUpdated(@Payload() data: AuthorUpdatedEvent): Promise<void> {
    try {
      this.logger.log(`Processing author.updated event for author ${data.authorId}`);
      await this.catalogService.handleAuthorUpdated(data);
      this.logger.log(`Author ${data.authorId} updated in catalog`);
    } catch (error) {
      this.logger.error(
        `Failed to process author.updated event for ${data.authorId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
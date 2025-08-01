import { NotFoundException } from '@nestjs/common';

export class PublicationNotFoundException extends NotFoundException {
  constructor(publicationId: string) {
    super(`Publication with ID ${publicationId} not found`);
  }
}
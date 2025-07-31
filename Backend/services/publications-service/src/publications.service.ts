import { Injectable } from '@nestjs/common';

@Injectable()
export class PublicationsService {
  private publications = [
    { id: 1, title: 'Sample Article', type: 'ARTICLE', status: 'PUBLISHED' },
    { id: 2, title: 'Sample Book', type: 'BOOK', status: 'DRAFT' },
  ];

  getHello(): object {
    return {
      message: 'Publications Service is running!',
      service: 'publications-service',
      port: process.env.PORT || 3002,
      endpoints: ['/publications/hello', '/publications/list', '/health']
    };
  }

  getPublications(): object {
    return {
      publications: this.publications,
      total: this.publications.length,
      message: 'Publications retrieved successfully'
    };
  }
}
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogService {
  private catalogItems = [
    { id: 1, title: 'Advanced Microservices', author: 'Dr. Smith', category: 'Technology' },
    { id: 2, title: 'Software Architecture Patterns', author: 'Jane Doe', category: 'Engineering' },
    { id: 3, title: 'Database Design Fundamentals', author: 'Bob Johnson', category: 'Data' },
  ];

  getHello(): object {
    return {
      message: 'Catalog Service is running!',
      service: 'catalog-service',
      port: process.env.PORT || 3003,
      endpoints: ['/catalog/hello', '/catalog/search', '/health']
    };
  }

  searchCatalog(query?: string): object {
    let results = this.catalogItems;
    
    if (query) {
      results = this.catalogItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.author.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );
    }

    return {
      query: query || 'all',
      results,
      total: results.length,
      message: 'Catalog search completed'
    };
  }
}
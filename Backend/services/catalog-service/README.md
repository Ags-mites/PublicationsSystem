# Catalog Service

A high-performance catalog microservice for academic publications with advanced search capabilities, event-driven synchronization, and comprehensive public APIs.

## Features

- **Advanced Search**: Full-text search with faceting, filtering, and sorting
- **Event-Driven**: Consumes publication events via RabbitMQ
- **Public APIs**: No authentication required for public catalog access
- **Performance**: Optimized with database indexes, caching, and rate limiting
- **Analytics**: Search metrics and catalog statistics
- **Health Monitoring**: Comprehensive health checks and metrics

## API Endpoints

### Publications
- `GET /api/v1/catalog/publications` - Search publications with pagination
- `GET /api/v1/catalog/publications/:id` - Get publication by ID
- `GET /api/v1/catalog/search` - Advanced search with facets
- `GET /api/v1/catalog/categories` - Get all categories

### Authors
- `GET /api/v1/catalog/authors` - Get authors with pagination
- `GET /api/v1/catalog/authors/top` - Get top authors by publication count
- `GET /api/v1/catalog/authors/:id` - Get author by ID
- `GET /api/v1/catalog/authors/:id/publications` - Get author's publications

### Statistics & Health
- `GET /api/v1/catalog/statistics` - Catalog metrics and statistics
- `GET /api/v1/health` - Health check
- `GET /api/v1/metrics` - Service metrics

## Search Parameters

- `q` - Search query (searches title, abstract, keywords)
- `type` - Publication type (ARTICLE, BOOK)
- `author` - Author name filter
- `category` - Category filter
- `yearFrom` / `yearTo` - Date range filters
- `page` / `limit` - Pagination (max 100 per page)
- `sortBy` - Sort by relevance, date, or title
- `sortOrder` - asc or desc

## Event Consumption

Listens for these RabbitMQ events:
- `publication.published` - Index new publication
- `publication.updated` - Update existing publication
- `publication.withdrawn` - Mark publication as withdrawn
- `author.created` - Add new author
- `author.updated` - Update author information

## Performance Features

- **Database Indexes**: Optimized for search operations
- **Response Caching**: TTL-based caching for frequent queries
- **Rate Limiting**: 100 requests/minute per IP
- **Query Optimization**: Efficient Prisma queries with aggregations
- **View Tracking**: Track publication popularity for relevance scoring

## Configuration

Environment variables:
- `PORT` - Service port (default: 3003)
- `DATABASE_URL` - CockroachDB connection string
- `RABBITMQ_URL` - RabbitMQ connection string
- `CONSUL_URL` - Consul registry URL

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

## Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## API Documentation

Swagger documentation available at `/docs` when running in development mode.

## Rate Limits

- General endpoints: 30-60 requests/minute
- Search endpoints: 30 requests/minute
- Statistics endpoints: 5-10 requests/minute

## Caching Strategy

- Publication details: 10 minutes
- Search results: 5 minutes
- Categories: 1 hour
- Statistics: 30 minutes

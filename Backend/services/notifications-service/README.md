# Notifications Service

A comprehensive multi-channel notification system with real-time capabilities, reliable delivery, and user preference management for the Academic Publications System.

## Features

- **Multi-Channel Delivery**: Email, WebSocket, and Push notification support
- **Real-Time Notifications**: WebSocket gateway for instant delivery
- **Event-Driven Architecture**: Consumes RabbitMQ events from other services
- **Reliable Delivery**: Retry mechanisms, dead letter queues, and delivery tracking
- **User Preferences**: Comprehensive notification preferences and subscriptions
- **Template Engine**: Handlebars-based email templates with multi-format support
- **Queue Management**: Bull-based job processing with Redis
- **Performance Monitoring**: Comprehensive metrics and health checks

## Architecture

### Notification Channels
- **Email**: SMTP-based with HTML/text templates
- **WebSocket**: Real-time browser notifications via Socket.IO
- **Push**: Mobile push notifications (placeholder for future implementation)

### Event Processing Flow
1. Consume events from RabbitMQ
2. Determine target users and their preferences
3. Generate notifications for enabled channels
4. Queue delivery jobs with priority and retry logic
5. Process delivery through appropriate channels
6. Track delivery status and handle failures

## API Endpoints

### Notifications Management
- `GET /api/v1/notifications` - Get user notifications (paginated)
- `GET /api/v1/notifications/unread-count` - Get unread notification count
- `PUT /api/v1/notifications/:id/mark-read` - Mark notification as read/unread
- `PUT /api/v1/notifications/mark-all-read` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification
- `DELETE /api/v1/notifications/clear-all` - Clear all read notifications
- `GET /api/v1/notifications/stats` - Get notification statistics

### User Preferences
- `GET /api/v1/notifications/preferences` - Get user preferences
- `PUT /api/v1/notifications/preferences` - Update preferences
- `GET /api/v1/notifications/preferences/defaults` - Get default preferences

### Event Subscriptions
- `GET /api/v1/notifications/subscriptions` - Get user subscriptions
- `POST /api/v1/notifications/subscriptions` - Create subscription
- `PUT /api/v1/notifications/subscriptions/:id` - Update subscription
- `DELETE /api/v1/notifications/subscriptions/:id` - Delete subscription
- `GET /api/v1/notifications/subscriptions/event-types` - Get available event types
- `POST /api/v1/notifications/subscriptions/bulk-create` - Create multiple subscriptions

### Health & Monitoring
- `GET /api/v1/health` - Service health check
- `GET /api/v1/metrics` - Service metrics and statistics

## WebSocket Events

### Client → Server
- `subscribe` - Subscribe to user notifications
- `unsubscribe` - Unsubscribe from notifications
- `ping` - Ping/pong heartbeat
- `markAsRead` - Mark notification as read

### Server → Client
- `notification` - New notification delivery
- `notificationRead` - Notification marked as read
- `subscribed` - Subscription confirmation
- `unsubscribed` - Unsubscription confirmation
- `error` - Error messages

## Event Consumption

Listens for these RabbitMQ events:
- `user.registered` - Welcome notifications for new users
- `user.login` - Login alert notifications
- `publication.submitted` - Submission confirmations
- `publication.approved` - Approval notifications
- `publication.published` - Publication announcements
- `publication.review.requested` - Review request notifications
- `publication.review.completed` - Review completion notifications

## Configuration

### Environment Variables
```env
# Application
NODE_ENV=development
PORT=3004
API_PREFIX=api/v1
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://notifications:pass@localhost:5432/notifications_db

# Email SMTP
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=password
EMAIL_FROM=noreply@academic-system.com

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE=notifications_queue

# Redis (Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Consul
CONSUL_URL=http://localhost:8500
```

## Notification Templates

Pre-built templates for all event types:
- User registration welcome emails
- Login alerts
- Publication lifecycle notifications
- Review process notifications
- Custom template support with Handlebars

## Reliability Features

### Delivery Guarantees
- **Email**: 3 retry attempts with exponential backoff
- **WebSocket**: 1 retry with immediate fallback
- **Push**: 2 retry attempts

### Failure Handling
- Dead letter queues for persistent failures
- Delivery status tracking and logging
- Automatic retry with configurable backoff
- Failed notification reporting

### User Experience
- Quiet hours support (no notifications during specified times)
- Digest emails for batched notifications
- Real-time delivery status updates
- Preference-based channel selection

## Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev

# Start with debug logging
npm run start:debug
```

## Production

```bash
# Build the application
npm run build

# Start production server
npm run start

# Health check
curl http://localhost:3004/api/v1/health
```

## Dependencies

### Core Services
- **Database**: CockroachDB with Prisma ORM
- **Message Queue**: RabbitMQ for event consumption
- **Cache/Queue**: Redis for Bull job processing
- **Email**: Nodemailer with SMTP transport
- **WebSocket**: Socket.IO for real-time delivery

### External Services
- **Service Discovery**: Consul for registration
- **Monitoring**: Built-in metrics and health checks

## Performance Considerations

- **Queue Processing**: Parallel job processing with priority queues
- **Database Optimization**: Indexed queries for fast lookups
- **Memory Management**: Efficient WebSocket connection handling
- **Rate Limiting**: Throttled API endpoints to prevent abuse
- **Template Caching**: Compiled template caching for performance

## Monitoring & Observability

- Real-time connection counts and user statistics
- Delivery success/failure rates and timing metrics
- Queue depth and processing time monitoring
- Email delivery tracking and bounce handling
- Comprehensive logging with correlation IDs

## Security Features

- Input validation and sanitization
- CORS configuration for WebSocket connections
- Rate limiting on API endpoints
- Secure email template rendering
- Environment-based configuration

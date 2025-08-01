import { registerAs } from '@nestjs/config';

export const rabbitmqConfig = registerAs('rabbitmq', () => ({
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'publication.events',
    exchangeType: process.env.RABBITMQ_EXCHANGE_TYPE || 'topic',
    prefetch: parseInt(process.env.RABBITMQ_PREFETCH || '10', 10),
    retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY || '5000', 10),
    maxRetries: parseInt(process.env.RABBITMQ_MAX_RETRIES || '3', 10),
    queues: {
        catalog: process.env.RABBITMQ_CATALOG_QUEUE || 'catalog.publications',
        notifications: process.env.RABBITMQ_NOTIFICATIONS_QUEUE || 'notifications.activity',
    },
}));
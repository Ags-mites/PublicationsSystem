import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queue: process.env.RABBITMQ_QUEUE || 'catalog_queue',
  exchange: process.env.RABBITMQ_EXCHANGE || 'publications_exchange',
  routingKey: process.env.RABBITMQ_ROUTING_KEY || 'publication.*',
}));
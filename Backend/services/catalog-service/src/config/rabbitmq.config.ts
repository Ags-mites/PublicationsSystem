import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queue: 'catalog_queue',
  exchange: 'publications_exchange',
  routingKey: 'publication.*',
}));
import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672',
  queue: 'catalog_queue',
  exchange: 'publications_exchange',
  routingKey: 'publication.*',
}));
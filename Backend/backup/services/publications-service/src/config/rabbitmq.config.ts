import { registerAs } from '@nestjs/config';
export const rabbitmqConfig = registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp:
  exchange: process.env.RABBITMQ_EXCHANGE || 'publications',
}));
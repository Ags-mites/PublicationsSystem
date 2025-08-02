import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queue: process.env.RABBITMQ_QUEUE || 'notifications_queue',
  exchange: process.env.RABBITMQ_EXCHANGE || 'system_events',
  routingKeys: {
    userRegistered: 'user.registered',
    userLogin: 'user.login',
    publicationSubmitted: 'publication.submitted',
    publicationApproved: 'publication.approved',
    publicationPublished: 'publication.published',
    reviewRequested: 'publication.review.requested',
    reviewCompleted: 'publication.review.completed',
  },
}));
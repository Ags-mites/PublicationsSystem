import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://notifications:notifications@localhost:5432/notifications_db',
}));
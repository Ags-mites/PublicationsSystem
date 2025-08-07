import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://root@localhost:26258/notifications_db?sslmode=disable',
}));
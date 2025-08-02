import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://catalog:catalog@localhost:5432/catalog_db',
}));
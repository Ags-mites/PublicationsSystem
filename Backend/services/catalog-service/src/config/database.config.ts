import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://catalog@localhost:26257/catalog_db?sslmode=disable&search_path=cat_schema',
}));
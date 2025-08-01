import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
    url: process.env.DATABASE_URL || 'postgresql://publications_user:publications_pass@localhost:26257/publications?sslmode=require',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '1000', 10),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
    ssl: process.env.DB_SSL === 'true',
    schema: process.env.DB_SCHEMA || 'public',
    logging: process.env.DB_LOGGING === 'true',
}));
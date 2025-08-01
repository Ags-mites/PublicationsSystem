import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'fallback-secret-key-for-development-only',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: process.env.JWT_ISSUER || 'publications-service',
  audience: process.env.JWT_AUDIENCE || 'publications-api',
  ignoreExpiration: process.env.NODE_ENV === 'development',
}));
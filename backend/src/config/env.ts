import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '8080', 10),
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'production',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'dinedeck_super_secret_jwt_key_2026_india_production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dinedeck_super_secret_refresh_key_2026_india_production',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};

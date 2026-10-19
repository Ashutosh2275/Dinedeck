import { PrismaClient } from '@prisma/client';
import { ENV } from './env.js';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: ENV.DATABASE_URL
    }
  },
  log: ENV.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

import { PrismaClient } from '@prisma/client';
import { ENV } from './env';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  global.prismaGlobal ||
  new PrismaClient({
    log: ENV.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (ENV.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

export const isDatabaseConfigured = (): boolean => {
  return Boolean(ENV.DATABASE_URL) && !ENV.DATABASE_URL.includes('your-supabase-project');
};

export default prisma;

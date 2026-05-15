import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Ensure pgbouncer=true is appended for Supabase transaction pooling
function getDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (url.includes('pgbouncer=true')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: getDatasourceUrl(),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function testConnection(maxRetries = 5, delayMs = 2000): Promise<boolean> {
  // Skip actual database connection if DATABASE_URL is not set
  if (!process.env.DATABASE_URL) {
    console.log('[DB] DATABASE_URL not set - skipping database connection');
    console.log('[DB] Running in demo mode without persistent storage');
    return true;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log(`[DB] Connection established (attempt ${attempt})`);
      return true;
    } catch (error) {
      console.error(`[DB] Connection attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new Error('Database connection failed after maximum retries');
}

export default prisma;
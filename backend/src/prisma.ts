import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Configure SQLite for production-grade concurrency, crash recovery & durability
async function configureSqlitePragmas() {
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
    await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;');
    console.log('[Database] SQLite configured with WAL mode & 5000ms busy timeout.');
  } catch (err: any) {
    console.warn('[Database] Notice initializing SQLite pragmas:', err.message);
  }
}

configureSqlitePragmas();

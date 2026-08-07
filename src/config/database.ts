import { PrismaClient } from '@prisma/client';
import { isProduction } from './env.js';

// A single shared Prisma client for the whole app.
export const prisma = new PrismaClient({
  log: isProduction ? ['error'] : ['warn', 'error'],
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

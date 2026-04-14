import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// Versioned key — bump when schema changes to bust the dev-mode singleton cache
const CACHE_KEY = "prisma_v6" as const;

const globalForPrisma = globalThis as unknown as {
  prisma_v6: PrismaClient | undefined;
};

export const db = globalForPrisma[CACHE_KEY] ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma[CACHE_KEY] = db;


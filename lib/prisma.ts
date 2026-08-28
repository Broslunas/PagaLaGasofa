import { PrismaClient } from "@prisma/client";

// Reuse the client across hot-reloads in dev so we don't exhaust MongoDB
// connections (each reload would otherwise spin up a fresh pool).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

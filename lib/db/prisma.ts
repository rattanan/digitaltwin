import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";
import { isProduction, requiredEnv } from "@/lib/env";

function createPrismaClient() {
  const connectionString = requiredEnv("DATABASE_URL");
  const parsed = new URL(connectionString);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));

  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT ?? 10),
    connectTimeout: Number(process.env.DATABASE_CONNECT_TIMEOUT ?? 10_000),
  });

  return new PrismaClient({
    adapter,
    log: isProduction() ? ["error"] : ["error", "warn"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!isProduction()) {
  globalForPrisma.prisma = prisma;
}

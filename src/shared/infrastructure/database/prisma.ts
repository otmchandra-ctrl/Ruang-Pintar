import { PrismaClient } from "@prisma/client";

// Ensure DIRECT_URL fallback for Postgres in serverless environments (e.g. Vercel)
if (typeof process !== "undefined" && process.env) {
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
}

declare global {
  var __ruangPintarPrisma__: PrismaClient | undefined;
  var __ruangPintarD1Prisma__: PrismaClient | undefined;
}

/**
 * Configure SQLite pragmas for performance, concurrency, foreign key enforcement, and data durability.
 */
export async function configureSqlitePragmas(client: PrismaClient): Promise<void> {
  // Only apply pragmas on native SQLite, skip on Cloudflare D1
  if ((client as any)?._custom_is_d1) return;

  try {
    await client.$queryRawUnsafe("PRAGMA foreign_keys = ON;");
    await client.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
    await client.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
    await client.$queryRawUnsafe("PRAGMA busy_timeout = 5000;");
  } catch {
    // Ignore if not supported in the active environment
  }
}

function resolveD1Binding(): any {
  if (typeof globalThis !== "undefined") {
    if ((globalThis as any).DB) return (globalThis as any).DB;
    if ((globalThis as any).__env__?.DB) return (globalThis as any).__env__.DB;
    if ((globalThis as any).env?.DB) return (globalThis as any).env.DB;
  }
  if (typeof process !== "undefined" && process.env) {
    if ((process.env as any).DB) return (process.env as any).DB;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    if (ctx?.env?.DB) return ctx.env.DB;
  } catch {
    // not running in opennext context
  }
  return undefined;
}

function createClient(): PrismaClient {
  const d1 = resolveD1Binding();
  if (d1) {
    if (!globalThis.__ruangPintarD1Prisma__) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaD1 } = require("@prisma/adapter-d1");
      const adapter = new PrismaD1(d1);
      const client = new PrismaClient({ adapter, log: ["error"] });
      (client as any)._custom_is_d1 = true;
      globalThis.__ruangPintarD1Prisma__ = client;
    }
    return globalThis.__ruangPintarD1Prisma__;
  }

  if (!globalThis.__ruangPintarPrisma__) {
    globalThis.__ruangPintarPrisma__ = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return globalThis.__ruangPintarPrisma__;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = createClient();
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

export default prisma;

import { NextResponse } from "next/server";
import { prisma } from "@/shared/infrastructure/database/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrlPresent = Boolean(process.env.DATABASE_URL);
  const directUrlPresent = Boolean(process.env.DIRECT_URL);
  const dbUrlPrefix = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.split("://")[0] + "://"
    : "not_set";

  let dbStatus = "disconnected";
  let userCount = 0;
  let dbError: string | null = null;

  try {
    userCount = await prisma.pengguna.count();
    dbStatus = "connected";
  } catch (err: unknown) {
    const errorObj = err as { message?: string; code?: string };
    dbError = errorObj?.message || String(err);
  }

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      environment: {
        is_vercel: Boolean(process.env.VERCEL),
        node_env: process.env.NODE_ENV,
        database_url_configured: dbUrlPresent,
        database_url_protocol: dbUrlPrefix,
        direct_url_configured: directUrlPresent,
      },
      database: {
        status: dbStatus,
        users_count: userCount,
        error: dbError,
      },
      message: isHealthy
        ? "Ruang Pintar runtime and database connection verified successfully."
        : "Database connection failed. Please ensure DATABASE_URL is set in Vercel project environment variables.",
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

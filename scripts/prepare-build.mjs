import { execSync } from "child_process";

const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
const dbUrl = process.env.DATABASE_URL || "";
const isPostgres = isVercel || dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

if (isPostgres) {
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
  console.log(
    "[Build Prepare] Target: Supabase PostgreSQL. Generating client from prisma/postgres/schema.prisma..."
  );
  execSync("npx prisma generate --schema prisma/postgres/schema.prisma", { stdio: "inherit" });
} else {
  console.log(
    "[Build Prepare] Target: SQLite (Development). Generating client from prisma/schema.prisma..."
  );
  execSync("npx prisma generate --schema prisma/schema.prisma", { stdio: "inherit" });
}

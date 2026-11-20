/**
 * Keeps Prisma text searches case-insensitive across the local SQLite and production PostgreSQL providers.
 * SQLite does not accept Prisma's `mode` filter, so it is added only for PostgreSQL URLs.
 */
export function containsText(value: string): any {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isPostgres = /^postgres(?:ql)?:\/\//i.test(databaseUrl);

  return {
    contains: value,
    ...(isPostgres ? { mode: "insensitive" as const } : {}),
  };
}

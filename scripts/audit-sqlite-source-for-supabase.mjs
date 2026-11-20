import { PrismaClient as SqliteClient, Prisma } from "../generated/sqlite-client/index.js";

const sourceUrl = process.env.SOURCE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!sourceUrl?.startsWith("file:")) {
  console.error("Set SOURCE_DATABASE_URL to a SQLite file URL before running this audit.");
  process.exit(1);
}

const sqlite = new SqliteClient({ datasources: { db: { url: sourceUrl } } });

try {
  const tables = await sqlite.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
  );
  const tableNames = new Set(tables.map((table) => table.name));
  const missingTables = [];
  const missingColumns = [];
  let totalRows = 0;
  let populatedTables = 0;

  for (const model of Prisma.dmmf.datamodel.models) {
    const tableName = model.dbName ?? model.name;
    if (!tableNames.has(tableName)) {
      missingTables.push(tableName);
      continue;
    }

    const quotedName = `"${tableName.replaceAll('"', '""')}"`;
    const columns = await sqlite.$queryRawUnsafe(`PRAGMA table_info(${quotedName});`);
    const columnNames = new Set(columns.map((column) => column.name));
    for (const field of model.fields.filter((item) => item.kind === "scalar")) {
      const columnName = field.dbName ?? field.name;
      if (!columnNames.has(columnName)) missingColumns.push(`${tableName}.${columnName}`);
    }

    const [{ count }] = await sqlite.$queryRawUnsafe(`SELECT COUNT(*) AS count FROM ${quotedName}`);
    const countValue = Number(count);
    totalRows += countValue;
    if (countValue > 0) populatedTables++;
  }

  const integrity = await sqlite.$queryRawUnsafe("PRAGMA integrity_check;");
  const integrityOk = integrity.length === 1 && integrity[0].integrity_check === "ok";
  const foreignKeyProblems = await sqlite.$queryRawUnsafe("PRAGMA foreign_key_check;");
  const foreignKeyGroups = new Map();

  for (const problem of foreignKeyProblems) {
    const tableName = problem.table;
    const quotedName = `"${String(tableName).replaceAll('"', '""')}"`;
    const constraints = await sqlite.$queryRawUnsafe(`PRAGMA foreign_key_list(${quotedName});`);
    const constraint = constraints.find((item) => Number(item.id) === Number(problem.fkid));
    const key = `${tableName}.${constraint?.from ?? "?"} -> ${problem.parent}`;
    foreignKeyGroups.set(key, (foreignKeyGroups.get(key) ?? 0) + 1);
  }

  console.log(`Schema models: ${Prisma.dmmf.datamodel.models.length}`);
  console.log(`Tables present: ${tableNames.size}`);
  console.log(`Populated application tables: ${populatedTables}`);
  console.log(`Total application rows: ${totalRows}`);
  console.log(`Missing schema tables: ${missingTables.length}`);
  if (missingTables.length) console.log(`Missing tables: ${missingTables.join(", ")}`);
  console.log(`Missing schema columns: ${missingColumns.length}`);
  if (missingColumns.length) console.log(`Missing columns: ${missingColumns.join(", ")}`);
  console.log(`SQLite integrity check: ${integrityOk ? "PASS" : "FAIL"}`);
  console.log(`Foreign-key violations: ${foreignKeyProblems.length}`);
  for (const [relation, count] of foreignKeyGroups) {
    console.log(`Foreign-key issue ${relation}: ${count} rows`);
  }

  if (!integrityOk || missingTables.length || missingColumns.length || foreignKeyProblems.length) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "SQLite source audit failed.");
  process.exitCode = 1;
} finally {
  await sqlite.$disconnect();
}

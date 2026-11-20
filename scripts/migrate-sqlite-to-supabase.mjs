import { createHash } from "node:crypto";
import { PrismaClient as PostgresClient, Prisma } from "@prisma/client";
import { PrismaClient as SqliteClient } from "../generated/sqlite-client/index.js";

const configuredDatabaseUrl = process.env.DATABASE_URL;
const sourceUrl =
  process.env.SOURCE_DATABASE_URL ??
  (configuredDatabaseUrl?.startsWith("file:") ? configuredDatabaseUrl : undefined);
const targetUrl = process.env.TARGET_DATABASE_URL;
const confirmedEmptyTarget = process.argv.includes("--confirm-empty-target");
const batchSize = 250;

if (!sourceUrl || !targetUrl) {
  console.error("Set SOURCE_DATABASE_URL and TARGET_DATABASE_URL before running this command.");
  process.exit(1);
}

if (!confirmedEmptyTarget) {
  console.error("Refusing to run without --confirm-empty-target.");
  process.exit(1);
}

const models = Prisma.dmmf.datamodel.models;
const modelsByName = new Map(models.map((model) => [model.name, model]));
const sqlite = new SqliteClient({ datasources: { db: { url: sourceUrl } } });
const postgres = new PostgresClient({ datasources: { db: { url: targetUrl } } });
const referencedKeys = new Map();
const expectedDigests = new Map();
const normalizedOrphans = new Map();

function delegate(client, model) {
  const name = model.name[0].toLowerCase() + model.name.slice(1);
  const result = client[name];
  if (!result) throw new Error(`Prisma delegate missing for model ${model.name}.`);
  return result;
}

function orderModelsByDependencies() {
  const byName = new Map(models.map((model) => [model.name, model]));
  const dependencies = new Map(
    models.map((model) => [
      model.name,
      new Set(
        model.fields
          .filter((field) => field.kind === "object" && field.relationFromFields?.length)
          .map((field) => field.type)
          .filter((name) => name !== model.name)
      ),
    ])
  );
  const ordered = [];
  const ready = models.filter((model) => dependencies.get(model.name).size === 0);

  while (ready.length) {
    const model = ready.shift();
    ordered.push(model);

    for (const candidate of models) {
      const required = dependencies.get(candidate.name);
      if (!required.has(model.name)) continue;
      required.delete(model.name);
      if (required.size === 0 && !ordered.includes(candidate) && !ready.includes(candidate)) {
        ready.push(candidate);
      }
    }
  }

  if (ordered.length !== byName.size) {
    const blocked = models
      .filter((model) => !ordered.includes(model))
      .map((model) => model.name)
      .join(", ");
    throw new Error(`Foreign-key dependency cycle prevents a safe import order: ${blocked}`);
  }

  return ordered;
}

function sortSelfReferences(model, rows) {
  const relations = model.fields.filter(
    (field) =>
      field.kind === "object" &&
      field.type === model.name &&
      field.relationFromFields?.length &&
      field.relationToFields?.length
  );
  if (!relations.length) return rows;

  const pending = [...rows];
  const ordered = [];
  const inserted = new Map(relations.map((relation) => [relation.name, new Set()]));

  while (pending.length) {
    const readyIndexes = [];
    for (let index = 0; index < pending.length; index++) {
      const row = pending[index];
      const canInsert = relations.every((relation) => {
        const foreignKey = row[relation.relationFromFields[0]];
        return foreignKey == null || inserted.get(relation.name).has(foreignKey);
      });
      if (canInsert) readyIndexes.push(index);
    }

    if (!readyIndexes.length) {
      throw new Error(
        `Self-referencing rows in ${model.name} contain a cycle or a missing parent.`
      );
    }

    for (const index of readyIndexes.reverse()) {
      const [row] = pending.splice(index, 1);
      ordered.push(row);
      for (const relation of relations) {
        const key = row[relation.relationToFields[0]];
        if (key != null) inserted.get(relation.name).add(key);
      }
    }
  }

  return ordered;
}

function canonical(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])])
    );
  }
  return value;
}

function rowDigest(rows) {
  const hash = createHash("sha256");
  const ordered = [...rows].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0
  );
  for (const row of ordered) hash.update(`${JSON.stringify(canonical(row))}\n`);
  return hash.digest("hex");
}

async function digestModel(client, model) {
  const hash = createHash("sha256");
  const prismaDelegate = delegate(client, model);
  let offset = 0;
  let total = 0;

  while (true) {
    const rows = await prismaDelegate.findMany({
      skip: offset,
      take: batchSize,
      orderBy: { id: "asc" },
    });
    if (!rows.length) break;
    for (const row of rows) hash.update(`${JSON.stringify(canonical(row))}\n`);
    total += rows.length;
    offset += rows.length;
  }

  return { total, hash: hash.digest("hex") };
}

function compositeKey(values) {
  return JSON.stringify(canonical(values));
}

async function getReferencedKeys(modelName, fieldNames) {
  const cacheKey = `${modelName}:${fieldNames.join(",")}`;
  if (referencedKeys.has(cacheKey)) return referencedKeys.get(cacheKey);

  const targetModel = modelsByName.get(modelName);
  if (!targetModel) throw new Error(`Referenced Prisma model ${modelName} was not found.`);
  const select = Object.fromEntries(fieldNames.map((field) => [field, true]));
  const rows = await delegate(sqlite, targetModel).findMany({ select });
  const keys = new Set(rows.map((row) => compositeKey(fieldNames.map((field) => row[field]))));
  referencedKeys.set(cacheKey, keys);
  return keys;
}

async function normalizeNullableOrphans(model, rows) {
  for (const relation of model.fields.filter(
    (field) => field.kind === "object" && field.relationFromFields?.length
  )) {
    const sourceFields = relation.relationFromFields;
    const targetFields = relation.relationToFields;
    if (!targetFields?.length || sourceFields.length !== targetFields.length) {
      throw new Error(`Unsupported foreign key shape in ${model.name}.${relation.name}.`);
    }

    const optional = sourceFields.every(
      (name) => !model.fields.find((field) => field.name === name)?.isRequired
    );
    const existingKeys = await getReferencedKeys(relation.type, targetFields);
    let repaired = 0;

    for (const row of rows) {
      const values = sourceFields.map((field) => row[field]);
      const nullCount = values.filter((value) => value == null).length;
      if (nullCount === values.length) continue;
      if (nullCount > 0) {
        throw new Error(`Partial composite foreign key found in ${model.name}.${relation.name}.`);
      }

      if (existingKeys.has(compositeKey(values))) continue;
      if (!optional) {
        throw new Error(
          `Required orphan foreign key in ${model.name}.${relation.name}; source was not changed.`
        );
      }

      for (const field of sourceFields) row[field] = null;
      repaired++;
    }

    if (repaired) {
      const key = `${model.dbName ?? model.name}.${sourceFields.join("+")} -> ${relation.type}`;
      normalizedOrphans.set(key, (normalizedOrphans.get(key) ?? 0) + repaired);
    }
  }

  return rows;
}

async function ensureTargetEmpty() {
  for (const model of models) {
    const count = await delegate(postgres, model).count();
    if (count !== 0) {
      throw new Error(
        `Target table ${model.dbName ?? model.name} is not empty (${count} rows). No data was changed.`
      );
    }
  }
}

async function readRowsForModel(model) {
  const prismaDelegate = delegate(sqlite, model);
  const hasSelfRelation = model.fields.some(
    (field) =>
      field.kind === "object" && field.type === model.name && field.relationFromFields?.length
  );

  if (hasSelfRelation) {
    return prismaDelegate.findMany({ orderBy: { id: "asc" } });
  }

  const rows = [];
  let offset = 0;
  while (true) {
    const batch = await prismaDelegate.findMany({
      skip: offset,
      take: batchSize,
      orderBy: { id: "asc" },
    });
    if (!batch.length) break;
    rows.push(...batch);
    offset += batch.length;
  }
  return rows;
}

async function copyModel(model) {
  let rows = await normalizeNullableOrphans(model, await readRowsForModel(model));
  rows = sortSelfReferences(model, rows);
  const targetDelegate = delegate(postgres, model);

  for (let offset = 0; offset < rows.length; offset += batchSize) {
    await targetDelegate.createMany({ data: rows.slice(offset, offset + batchSize) });
  }

  return { count: rows.length, hash: rowDigest(rows) };
}

async function main() {
  await ensureTargetEmpty();
  const orderedModels = orderModelsByDependencies();
  console.log(`Target is empty. Importing ${orderedModels.length} tables in dependency order.`);

  for (const model of orderedModels) {
    const { count, hash } = await copyModel(model);
    expectedDigests.set(model.name, hash);
    console.log(`Copied ${model.dbName ?? model.name}: ${count} rows`);
  }

  for (const [relation, count] of normalizedOrphans) {
    console.log(
      `Applied on-delete SetNull for ${relation}: ${count} rows (SQLite source unchanged)`
    );
  }

  console.log("Comparing per-table row counts and SHA-256 content checksums...");
  for (const model of models) {
    const target = await digestModel(postgres, model);
    const expectedHash = expectedDigests.get(model.name);
    if (target.total !== (await delegate(sqlite, model).count()) || target.hash !== expectedHash) {
      throw new Error(`Data verification failed for ${model.dbName ?? model.name}.`);
    }
    console.log(`Verified ${model.dbName ?? model.name}: ${target.total} rows`);
  }

  console.log("SQLite to PostgreSQL transfer completed and verified.");
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  console.error("Do not point the app at this target. Recreate an empty target before retrying.");
  process.exitCode = 1;
} finally {
  await Promise.allSettled([sqlite.$disconnect(), postgres.$disconnect()]);
}

import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

async function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const contents = await readFile(new URL("../.env", import.meta.url), "utf8");
  const line = contents
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL is not configured");
  return line
    .slice(line.indexOf("=") + 1)
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

const baseUrl = await loadDatabaseUrl();
const schema = `reviewreply_clean_${Date.now()}`;
const cleanUrl = new URL(baseUrl);
cleanUrl.searchParams.set("schema", schema);
const packageManager = process.env.npm_execpath;
if (!packageManager)
  throw new Error("Run this check through pnpm: pnpm verify:clean-install");

const environment = { ...process.env, DATABASE_URL: cleanUrl.toString() };
const migration = spawnSync(
  process.execPath,
  [packageManager, "exec", "prisma", "migrate", "deploy"],
  { cwd: new URL("..", import.meta.url), env: environment, stdio: "inherit" },
);
if (migration.status !== 0) process.exit(migration.status ?? 1);

const database = new PrismaClient({ datasources: { db: { url: baseUrl } } });
try {
  const tables = await database.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = '${schema}'`,
  );
  if (!Array.isArray(tables) || Number(tables[0]?.count) < 10)
    throw new Error("Clean installation did not create the expected schema");
  console.log(`Clean installation verified with ${tables[0].count} tables.`);
} finally {
  await database.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await database.$disconnect();
}

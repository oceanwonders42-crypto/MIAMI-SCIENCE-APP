/**
 * Applies supabase/migrations/00045_meal_logs.sql using Postgres DIRECT_URL / DATABASE_URL.
 *
 * Supabase Dashboard → Project Settings → Database → Connection string → URI
 * (use the "Direct connection" or pooler URI; needs the database password).
 *
 * Set in .env.local:
 *   DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-...pooler.supabase.com:6543/postgres
 * Or pass: DATABASE_URL="..." node scripts/apply-meal-logs-from-env.mjs
 *
 * Does not print the URL or password. Safe to re-run (IF NOT EXISTS + DROP POLICY IF EXISTS).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const migrationPath = path.join(root, "supabase/migrations/00045_meal_logs.sql");

function loadEnvLocal(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const kemst = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[kemst] = v;
  }
  return out;
}

const fileEnv = loadEnvLocal(path.join(root, ".env.local"));
const connectionString =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  fileEnv.DATABASE_URL ||
  fileEnv.DIRECT_URL;

if (!connectionString?.trim()) {
  console.log(
    JSON.stringify({
      ok: false,
      error:
        "DATABASE_URL or DIRECT_URL missing. Add Postgres URI to .env.local (see Supabase Dashboard → Database), then re-run.",
    })
  );
  process.exit(2);
}

const sql = fs.readFileSync(migrationPath, "utf8");
const useSsl =
  /supabase\.co|pooler\.supabase\.com/i.test(connectionString) ||
  connectionString.includes("sslmode=require");

const client = new pg.Client({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
  const hostMatch = connectionString.match(/@([^/?:]+)/);
  console.log(
    JSON.stringify({
      ok: true,
      applied: "00045_meal_logs.sql",
      host: hostMatch ? hostMatch[1] : "unknown",
    })
  );
} catch (e) {
  try {
    await client.query("ROLLBACK");
  } catch {
    /* noop */
  }
  const msg = e instanceof Error ? e.message : String(e);
  console.log(JSON.stringify({ ok: false, error: msg }));
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}

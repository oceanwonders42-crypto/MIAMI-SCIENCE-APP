/**
 * Operational check: live Supabase (from .env.local) — meal_logs, affiliates room, storage buckets.
 * Does not print secrets. Run: node scripts/verify-remote-supabase.mjs
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

function loadEnvLocal(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file}`);
  }
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const e = loadEnvLocal(envPath);
const url = e.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = e.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.log(
    JSON.stringify({
      ok: false,
      error: "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local",
    })
  );
  process.exit(2);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = {};

const meal = await supabase.from("meal_logs").select("id").limit(1);
results.meal_logs = {
  ok: !meal.error,
  code: meal.error?.code ?? null,
  message: meal.error?.message ?? null,
  hint: meal.error?.hint ?? null,
};

const affiliates = await supabase
  .from("chat_rooms")
  .select("id,slug,name")
  .eq("slug", "affiliates")
  .maybeSingle();
results.chat_rooms_affiliates = {
  ok: !affiliates.error,
  code: affiliates.error?.code ?? null,
  message: affiliates.error?.message ?? null,
  row: affiliates.data
    ? { id: affiliates.data.id, slug: affiliates.data.slug }
    : null,
};

const buckets = await supabase.storage.listBuckets();
results.storage_buckets = {
  ok: !buckets.error,
  code: buckets.error?.code ?? null,
  message: buckets.error?.message ?? null,
  names: (buckets.data ?? []).map((b) => b.name).sort(),
  has_progress_photos: (buckets.data ?? []).some((b) => b.name === "progress-photos"),
};

console.log(JSON.stringify({ supabase_host: new URL(url).host, results }, null, 2));
process.exit(0);

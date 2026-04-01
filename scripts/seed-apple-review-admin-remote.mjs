/**
 * Upsert Apple Review admin in the Supabase project referenced by .env.local.
 * Uses Admin API + service role (no DB password). Does not print secrets.
 * Run: node scripts/seed-apple-review-admin-remote.mjs
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

function loadEnvLocal(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
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

const REVIEW_EMAIL = "apple.review@miascience.com";
const REVIEW_PASSWORD = "MiamiSciAppleReview2026!";

const e = loadEnvLocal(envPath);
const url = e.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = e.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    JSON.stringify({ ok: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" })
  );
  process.exit(2);
}

const sb = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let page = 1;
let existingId = null;
for (;;) {
  const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error(JSON.stringify({ ok: false, step: "listUsers", error: error.message }));
    process.exit(3);
  }
  const hit = data.users.find((u) => u.email?.toLowerCase() === REVIEW_EMAIL);
  if (hit) {
    existingId = hit.id;
    break;
  }
  if (data.users.length < 200) break;
  page += 1;
}

if (existingId) {
  const { error: delErr } = await sb.auth.admin.deleteUser(existingId);
  if (delErr) {
    console.error(JSON.stringify({ ok: false, step: "deleteUser", error: delErr.message }));
    process.exit(4);
  }
}

const { data: created, error: createErr } = await sb.auth.admin.createUser({
  email: REVIEW_EMAIL,
  password: REVIEW_PASSWORD,
  email_confirm: true,
  user_metadata: {
    full_name: "Apple Review",
    seed_account: true,
    apple_review: true,
  },
});

if (createErr || !created?.user?.id) {
  console.error(
    JSON.stringify({ ok: false, step: "createUser", error: createErr?.message ?? "no user id" })
  );
  process.exit(5);
}

const uid = created.user.id;

const { error: roleErr } = await sb.from("user_roles").update({ role: "admin" }).eq("user_id", uid);
if (roleErr) {
  console.error(JSON.stringify({ ok: false, step: "user_roles", error: roleErr.message }));
  process.exit(6);
}

const { error: profErr } = await sb
  .from("profiles")
  .update({
    display_name: "Apple Review",
    full_name: "Apple Review",
    fitness_goal: "general_fitness",
    preferred_units: "metric",
    timezone: "America/New_York",
    updated_at: new Date().toISOString(),
  })
  .eq("user_id", uid);

if (profErr) {
  console.error(JSON.stringify({ ok: false, step: "profiles", error: profErr.message }));
  process.exit(7);
}

console.log(
  JSON.stringify({
    ok: true,
    supabase_host: new URL(url).host,
    user_id: uid,
    email: REVIEW_EMAIL,
  })
);

# Miami Science Tracker

Next.js app for Miami Science customers and affiliates: training logs, supplies (stack), orders, rewards, affiliate tools, and community. **Self-tracking and ecommerce only** — not medical advice.

## Tech stack

Next.js (App Router), TypeScript, Tailwind, Supabase (Auth, Postgres, Storage). Roles: customer, affiliate, admin.

## Local setup

```bash
git clone https://github.com/oceanwonders42-crypto/MIAMI-SCIENCE-APP.git
cd MIAMI-SCIENCE-APP
pnpm install
```

## Environment

1. Copy **`.env.example`** → **`.env.local`** (never commit `.env.local`; it is gitignored).
2. Required for a working app: **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (see Supabase → Project Settings → API).
3. Optional / feature-specific keys (WooCommerce, webhooks, email, image generation, etc.) are documented inline in **`.env.example`**.

Apply database schema from **`supabase/migrations/`** (SQL Editor or Supabase CLI) before first use.

## Run (development)

```bash
pnpm dev
```

Opens the dev server (default **http://localhost:3000**; another port is used if 3000 is busy). Sign up or log in to reach the dashboard.

## Build (production)

```bash
pnpm run build
pnpm start
```

Other scripts: **`pnpm run lint`**, Capacitor **`pnpm run cap:sync`** / **`pnpm run cap:ios`** (see `docs/CAPACITOR_IOS_SETUP.md`).

## Exercise photos (training)

Bundled **PNG** assets for featured library exercises live under **`public/exercises/`** (e.g. `exercise-{slug}.png` and `exercise-{slug}-women.png`). Resolution order: DB **`image_url`** → optional overrides in **`src/lib/exerciseMedia.ts`** → these files → SVG fallback. Details: **`public/exercises/README.md`**. To refresh from a zip asset pack: **`node scripts/sync-fitness-zip-assets.mjs <path-to-zip>`**.

## More documentation

- **Demo orders / seed:** `supabase/seed_demo_phase5.sql`, optional `NEXT_PUBLIC_ALLOW_DEMO_SEED` (see below).
- **Deployment, accounts, iOS:** `docs/` (e.g. `DEPLOYMENT.md`, `TEST_ACCOUNTS_SETUP.md`, `CAPACITOR_IOS_SETUP.md`).

When ecommerce is not connected, you can seed demo orders: edit `supabase/seed_demo_phase5.sql` with your user id, or in dev set `NEXT_PUBLIC_ALLOW_DEMO_SEED=true` for the Orders page “Add demo data” button — **do not enable in production**.

## Disclaimer

Informational and self-tracking only. Follow your licensed healthcare professional’s guidance.

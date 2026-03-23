# Miami Science Tracker

Mobile-first web app for Miami Science customers and affiliates: routine tracking, supply, orders, rewards, affiliate dashboard, and community.

**Product constraints:** This app is for self-tracking, logging, ecommerce, and community only. It does not provide medical advice, diagnosis, or treatment recommendations.

## Tech stack

- **Next.js** (App Router), **TypeScript**, **Tailwind CSS**
- **Supabase** (Auth, PostgreSQL, Storage)
- Modular architecture, role-based access (customer, affiliate, admin)

## Getting started

1. **Clone and install**
   ```bash
   pnpm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Run migrations in order: `00001_initial_schema.sql`, `00002_phase4_profile_workouts_supplies.sql`, `00003_phase5_orders_shipments_rewards.sql` (SQL editor or `supabase db push`).
   - Copy `.env.example` to `.env.local` and set:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Run**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Sign up or log in to reach the dashboard.

## Routes

| Route | Access |
|-------|--------|
| `/`, `/login`, `/signup`, `/forgot-password` | Public |
| `/onboarding` | Authenticated |
| `/dashboard`, `/training`, `/progress`, `/stack`, `/orders`, `/rewards`, `/community`, `/account` | All authenticated |
| `/affiliate` | Affiliate, Admin |
| `/admin` | Admin |

## Roles

- **customer** — Dashboard, training, progress, stack, orders, rewards, community, account.
- **affiliate** — Same + affiliate dashboard (clicks, conversions, commissions, referral link, affiliate chat).
- **admin** — Full access: user roles, moderation, featured products, reward adjustments, announcements.

Assign roles in the `user_roles` table (e.g. set `role = 'affiliate'` or `'admin'` for a user).

## Project structure

- `src/app` — App Router pages and layouts (auth, dashboard, admin).
- `src/components/ui` — Design system (Card, Stats, Badge, Tabs, Section, Disclaimer).
- `src/components/layout` — AppNav, Sidebar, Header.
- `src/lib` — Supabase client (browser + server), auth helpers, constants, utils.
- `src/types` — Shared TypeScript types and database types.
- `supabase/migrations` — SQL schema and RLS.

## Demo data (orders, shipments, rewards)

When live ecommerce integration is not connected, you can seed demo data:

- **Option A — SQL:** Edit `supabase/seed_demo_phase5.sql`, set `demo_user_id` to your `auth.users.id` (from Supabase Auth or `SELECT id FROM auth.users WHERE email = 'your@email.com'`), then run the script in the Supabase SQL Editor.
- **Option B — Dev-only button:** In development, set `NEXT_PUBLIC_ALLOW_DEMO_SEED=true` in `.env.local`. The Orders page will show an “Add demo data” button when you have no orders; it inserts one order, one shipment, and sample reward ledger rows for the signed-in user. Do not enable in production.

## Disclaimer

This app is for informational and self-tracking purposes only and does not provide medical advice. Always follow the guidance of your licensed healthcare professional.

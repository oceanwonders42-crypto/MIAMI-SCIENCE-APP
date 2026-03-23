# Miami Science Tracker — Architecture & MVP Plan

## 1. App Architecture Summary

- **Framework:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend / Data:** Supabase (Auth, PostgreSQL, Storage, RLS)
- **Pattern:** Server-first with client components only where needed (forms, nav, real-time)
- **Auth:** Supabase Auth with session in cookies; middleware protects routes by role
- **State:** Server state via Supabase + React Query (or server components + refetch); minimal client state (UI only)
- **Scale path:** Modular feature folders, shared lib/types/components; ready for device APIs and ecommerce/SliceWP later

---

## 2. Folder Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing → redirect
│   ├── globals.css
│   ├── (auth)/                    # Auth group
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── onboarding/page.tsx
│   ├── (dashboard)/               # Protected app
│   │   ├── layout.tsx             # Shell + nav
│   │   ├── dashboard/page.tsx
│   │   ├── training/page.tsx
│   │   ├── progress/page.tsx
│   │   ├── stack/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── rewards/page.tsx
│   │   ├── affiliate/page.tsx
│   │   ├── community/page.tsx
│   │   └── account/page.tsx
│   └── admin/
│       ├── layout.tsx
│       └── page.tsx
├── components/
│   ├── ui/                        # Design system primitives
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Stats.tsx
│   │   ├── Tabs.tsx
│   │   ├── Section.tsx
│   │   └── Disclaimer.tsx
│   ├── layout/
│   │   ├── AppNav.tsx             # Bottom nav (mobile) / sidebar (desktop)
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── shared/
│       └── ...                    # Shared feature-agnostic components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── auth.ts                    # Role helpers, session
│   ├── constants.ts
│   └── utils.ts
├── types/
│   ├── database.ts                # Supabase-generated or hand-written
│   └── index.ts
├── hooks/
│   └── use-user.ts
└── styles/
    └── (if any extra)
supabase/
├── migrations/
│   └── 00001_initial_schema.sql
└── seed.sql                       # Optional dev seed
```

---

## 3. Route Structure

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Public | Landing → redirect to dashboard or login |
| `/login` | Public | Login |
| `/signup` | Public | Sign up |
| `/forgot-password` | Public | Password reset |
| `/onboarding` | Authenticated | Profile setup after first login |
| `/dashboard` | customer, affiliate, admin | Main dashboard |
| `/training` | customer, affiliate, admin | Workout logging |
| `/progress` | customer, affiliate, admin | Body metrics, progress |
| `/stack` | customer, affiliate, admin | Supply tracker |
| `/orders` | customer, affiliate, admin | Order history, shipments |
| `/rewards` | customer, affiliate, admin | Reward points |
| `/affiliate` | affiliate, admin | Affiliate dashboard |
| `/community` | customer, affiliate, admin | Community / chat |
| `/account` | All authenticated | Account / settings |
| `/admin` | admin | Admin panel |

---

## 4. Database Tables (Supabase / PostgreSQL)

- **profiles** — id (uuid, PK), user_id (uuid, FK auth.users), display_name, avatar_url, created_at, updated_at
- **user_roles** — id, user_id (FK), role (enum: customer, affiliate, admin), created_at
- **workouts** — id, user_id, name, started_at, completed_at, notes
- **workout_entries** — id, workout_id, exercise_name, sets, reps, weight, notes
- **body_metrics** — id, user_id, recorded_at, weight_kg, optional measurements (jsonb or columns)
- **protocols** — id, user_id, name, description, created_at
- **protocol_logs** — id, protocol_id, logged_at, adherence (e.g. completed/partial/skipped), notes
- **supplies** — id, user_id, product_id (nullable), name, unit, current_count, threshold_alert, updated_at
- **products** — id, name, slug, image_url, shop_url, created_at (for links and future ecommerce)
- **product_links** — id, product_id, label, url, sort_order (shop/reorder links)
- **orders** — id, user_id, external_id, status, total_cents, created_at, metadata (jsonb)
- **shipments** — id, order_id, carrier, tracking_number, status, estimated_delivery, delivered_at
- **reward_points_ledger** — id, user_id, amount_delta, reason, reference_type, reference_id, created_at
- **affiliate_profiles** — id, user_id, referral_code, coupon_code, status, created_at
- **affiliate_stats_cache** — id, user_id, period, clicks, conversions, commission_cents, updated_at
- **chat_rooms** — id, slug, name, is_affiliate_only, created_at
- **chat_room_members** — id, room_id, user_id, role, joined_at
- **chat_messages** — id, room_id, user_id, content, created_at, edited_at
- **notifications** — id, user_id, type, title, body, read_at, created_at
- **moderation_reports** — id, reporter_id, message_id, reason, status, created_at

RLS policies: per-table by role and user_id; admin can read/write where needed; affiliate-only rooms restricted to affiliate role.

---

## 5. Role Model

- **customer** — Default; dashboard, training, progress, stack, orders, rewards, community, account.
- **affiliate** — Everything customer has + affiliate dashboard (clicks, conversions, commissions, referral link, coupon, referred orders, affiliate chat).
- **admin** — Full access; user roles, moderation, featured products, reward adjustments, announcements.

Roles stored in `user_roles`; one user can have one primary role (or we resolve by precedence: admin > affiliate > customer). Middleware and API/server logic check role for `/admin` and `/affiliate` (affiliate-only content).

---

## 6. Core UI Components

- **Card** — Container with optional title, padding, border, shadow (design system base).
- **Stats** — Value + label + optional trend (dashboard widgets).
- **Badge** — Status/labels (order status, role, count).
- **Tabs** — Horizontal tabs for section switching (e.g. Orders: All / Shipped).
- **Section** — Title + optional action + children (page sections).
- **Disclaimer** — Standard app disclaimer text (footer/modals where relevant).
- **AppNav** — Bottom nav on mobile, sidebar on desktop; items by role.
- **Header** — Top bar with title, optional actions.
- **Sidebar** — Desktop nav list; collapsible if needed.

---

## 7. MVP Boundaries

**In scope for initial foundation:**
- Auth (signup, login, forgot password), onboarding shell, role in DB and middleware.
- Dashboard shell with placeholder widgets.
- Placeholder screens for Training, Progress, Stack, Orders, Rewards, Affiliate, Community, Account.
- Design system (cards, stats, tabs, nav, badge, section, disclaimer).
- Supabase client (browser + server), env template, shared types.
- Middleware: protect `/dashboard/*`, `/account`, `/onboarding`; allow `/admin` only for admin role; allow `/affiliate` for affiliate + admin.
- DB schema (migration SQL); no fake server logic; TODOs only for external integrations (e.g. SliceWP, device APIs, ecommerce).

**Explicitly later (Phase 2/3):**
- Real workout/body-metrics CRUD and progress charts.
- Real supply CRUD and countdown.
- Real orders/shipments (API or webhook from Miami Science / WooCommerce).
- Reward points calculation and history.
- SliceWP affiliate sync and live stats.
- Real-time community/affiliate chat.
- Admin moderation UI and announcements.
- Device integrations and deep ecommerce integration.

---

## 8. Phase 2 / Phase 3 Expansion Notes

- **Phase 2:** Implement real features per module (training logs, progress charts, stack CRUD, orders from API), reward balance from ledger, affiliate dashboard with real stats (or mocked from SliceWP later).
- **Phase 3:** SliceWP sync, real-time chat, push notifications, device integrations, featured products CMS, advanced moderation.
- **Integrations:** Keep a single `lib/integrations/` or `lib/external/` for SliceWP, ecommerce API, device APIs; use env flags to enable/disable.

---

*This app is for informational and self-tracking purposes only and does not provide medical advice. Always follow the guidance of your licensed healthcare professional.*

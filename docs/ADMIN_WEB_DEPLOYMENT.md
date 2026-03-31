# Admin web deployment (operator / App Store split)

## Problem

`NEXT_PUBLIC_APP_STORE_BUILD=true` on production hides `/admin` so the iOS WebView cannot reach operator routes (see `src/middleware.ts` + `src/lib/app-store-admin-guard.ts`).

## Solution

Use **one Vercel project** (same Git branch and build) with **two domains**:

| Host | Purpose | Env |
|------|---------|-----|
| Public app (e.g. `app.mia-science.com`) | Customers, affiliates, Capacitor shell | `NEXT_PUBLIC_APP_STORE_BUILD=true` — **omit** `NEXT_PUBLIC_ADMIN_WEB_HOSTS` |
| Operator web (e.g. `ops.app.mia-science.com`) | Admin UI | Same flags **plus** `NEXT_PUBLIC_ADMIN_WEB_HOSTS=ops.app.mia-science.com` |

Middleware reads the `Host` header. If the host matches an entry in `NEXT_PUBLIC_ADMIN_WEB_HOSTS`, `/admin` is **not** redirected, even when the App Store build flag is on.

## Vercel setup

1. **Domains:** Add both domains to the project. SSL is automatic.
2. **Environment variables:** Add `NEXT_PUBLIC_ADMIN_WEB_HOSTS` only on **Production** (or use a single value that lists every admin hostname). Values are comma-separated, no ports (e.g. `ops.app.mia-science.com,staging-ops.example.com`).
3. **Redeploy** after changing env.

`NEXT_PUBLIC_*` vars are inlined at build time. If Vercel uses **one build** for all domains, **you cannot** set different `NEXT_PUBLIC_ADMIN_WEB_HOSTS` per domain on the same deployment artifact unless you use **multiple projects** or **preview** builds. Practical options:

- **Option A (recommended here):** One production build with  
  `NEXT_PUBLIC_ADMIN_WEB_HOSTS=ops.app.mia-science.com`  
  Public traffic on `app.mia-science.com` still redirects `/admin` because that host is not in the allowlist; ops hostname matches and gets admin.

## Verification

- On **public** host: customer and affiliate sessions hitting `/admin` → redirect to `/dashboard`.
- On **admin web** host: admin user → `/admin`, `/admin/integrations`, and nav subpages load (role checks unchanged in app layouts).

## Alternate: second Vercel project

Duplicate the project, set `NEXT_PUBLIC_APP_STORE_BUILD=false` on the ops deployment only, and point the ops domain there. The codebase in this repo favors the **single project + host allowlist** approach to avoid drift.

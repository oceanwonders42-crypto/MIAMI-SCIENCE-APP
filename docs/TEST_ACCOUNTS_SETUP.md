# Local/dev test accounts — Miami Science Tracker

Use this to create three test accounts after you have created the auth users in Supabase Auth.

**Placeholder emails (create these in Supabase Auth first):**

- `admin@miamiscience.local`
- `affiliate@miamiscience.local`
- `customer@miamiscience.local`

---

## 1. REQUIRED TABLES

These must exist (from migrations):

| Table             | Purpose |
|-------------------|---------|
| **auth.users**    | Supabase Auth — you create the 3 users here first. |
| **public.profiles** | One row per user (created by trigger on signup). Needs `full_name` and `display_name` for dashboard access (onboarding complete). |
| **public.user_roles** | One row per user, column `role` (`app_role`: `'customer'` \| `'affiliate'` \| `'admin'`). Created by trigger with `'customer'`. |
| **public.affiliate_profiles** | One row per affiliate. Required for affiliate account to see affiliate features. |

**Relevant columns:**

- **user_roles:** `user_id` (UUID, FK to auth.users), `role` (app_role, default `'customer'`).
- **profiles:** `user_id`, `full_name`, `display_name`, plus optional fitness_goal, preferred_units, timezone, etc.
- **affiliate_profiles:** `user_id`, `referral_code` (NOT NULL, UNIQUE), `status` (default `'active'`), optional `coupon_code`, `referral_link`, `payout_status`.

---

## 2. ROLE REQUIREMENTS BY ACCOUNT TYPE

| Account type   | user_roles.role | profiles row        | affiliate_profiles row |
|----------------|-----------------|---------------------|-------------------------|
| **Admin**      | `'admin'`       | Yes (trigger); set full_name, display_name so onboarding passes | No |
| **Affiliate**  | `'affiliate'`   | Yes (trigger); set full_name, display_name | Yes — one row with unique referral_code |
| **Customer**   | `'customer'`    | Yes (trigger); set full_name, display_name | No |

**Notes:**

- On signup, trigger `on_auth_user_created` inserts `profiles(user_id)` and `user_roles(user_id, 'customer')`. So after creating the 3 users in Auth, all three already have a profile and a customer role.
- You only need to: (1) update `user_roles.role` for admin and affiliate, (2) insert `affiliate_profiles` for the affiliate, (3) set `profiles.full_name` and `profiles.display_name` for all three so they can skip onboarding.

---

## 3. SQL TO ASSIGN ROLES

Run in Supabase SQL Editor **after** the 3 auth users exist. This updates the role for admin and affiliate and leaves customer as-is.

```sql
-- Set admin role
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@miamiscience.local');

-- Set affiliate role (customer → affiliate)
UPDATE public.user_roles
SET role = 'affiliate'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'affiliate@miamiscience.local');

-- Customer stays 'customer' (trigger default) — no UPDATE needed
```

---

## 4. SQL TO CREATE AFFILIATE PROFILE

Run after the affiliate auth user exists and after assigning the affiliate role (or in the same batch). Use a unique `referral_code` per environment.

```sql
INSERT INTO public.affiliate_profiles (user_id, referral_code, status)
SELECT id, 'AFFILIATE-TEST-DEV', 'active'
FROM auth.users
WHERE email = 'affiliate@miamiscience.local'
ON CONFLICT (user_id) DO NOTHING;
```

If you need to set optional fields:

```sql
-- Optional: set referral_link and payout_status after insert
UPDATE public.affiliate_profiles
SET referral_link = 'https://mia-science.com/?ref=AFFILIATE-TEST-DEV',
    payout_status = 'pending'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'affiliate@miamiscience.local');
```

---

## 5. SQL TO COMPLETE PROFILES (SKIP ONBOARDING)

Run so all three accounts have `full_name` and `display_name` and can access the dashboard without being redirected to onboarding.

```sql
UPDATE public.profiles
SET full_name = 'Admin Test', display_name = 'Admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@miamiscience.local');

UPDATE public.profiles
SET full_name = 'Affiliate Test', display_name = 'Affiliate'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'affiliate@miamiscience.local');

UPDATE public.profiles
SET full_name = 'Customer Test', display_name = 'Customer'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'customer@miamiscience.local');
```

---

## 6. FULL SCRIPT (RUN AFTER AUTH USERS EXIST)

You can run this as one script in order:

```sql
-- 1. Assign roles
UPDATE public.user_roles SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@miamiscience.local');

UPDATE public.user_roles SET role = 'affiliate'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'affiliate@miamiscience.local');

-- 2. Affiliate profile (required for affiliate features)
INSERT INTO public.affiliate_profiles (user_id, referral_code, status)
SELECT id, 'AFFILIATE-TEST-DEV', 'active'
FROM auth.users WHERE email = 'affiliate@miamiscience.local'
ON CONFLICT (user_id) DO NOTHING;

-- 3. Complete profiles so all three can use the app without onboarding
UPDATE public.profiles SET full_name = 'Admin Test', display_name = 'Admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@miamiscience.local');

UPDATE public.profiles SET full_name = 'Affiliate Test', display_name = 'Affiliate'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'affiliate@miamiscience.local');

UPDATE public.profiles SET full_name = 'Customer Test', display_name = 'Customer'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'customer@miamiscience.local');
```

---

## 7. HOW TO VERIFY EACH ACCOUNT WORKS

1. **Create the 3 users in Supabase Auth**  
   Dashboard → Authentication → Users → Add user. Create:
   - `admin@miamiscience.local` (set a password you’ll use locally)
   - `affiliate@miamiscience.local`
   - `customer@miamiscience.local`

2. **Run the full script above** in SQL Editor.

3. **Admin**
   - Log in with `admin@miamiscience.local`.
   - You should land on dashboard (or onboarding once; complete it if asked).
   - Open `/admin` — you should see the Admin area (QA, Affiliates, Integrations, Exercise library, etc.).
   - If you’re sent to dashboard instead of admin, role didn’t apply; re-run the admin `UPDATE user_roles` and sign out/in.

4. **Affiliate**
   - Log in with `affiliate@miamiscience.local`.
   - Account page should show an “Affiliate” section with status and referral info.
   - Open `/affiliate` (or the affiliate dashboard link) — should see affiliate dashboard, not “access denied”.
   - If affiliate section or `/affiliate` is missing or denied, check `user_roles.role = 'affiliate'` and that `affiliate_profiles` has a row for this `user_id`.

5. **Customer**
   - Log in with `customer@miamiscience.local`.
   - Should see normal dashboard (Training, Stack, Orders, Account). No Admin link, no Affiliate section in Account.
   - `/admin` should redirect to dashboard (non-admin).

**Quick role check in DB:**

```sql
SELECT u.email, r.role
FROM auth.users u
JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email LIKE '%@miamiscience.local';
```

Expected: one row each with `admin`, `affiliate`, `customer`.

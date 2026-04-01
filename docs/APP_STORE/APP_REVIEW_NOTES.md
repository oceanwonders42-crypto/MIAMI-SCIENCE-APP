# App Review Information — paste into App Store Connect

**App:** Miami Science Tracker (Capacitor shell loading https://app.mia-science.com)

**What it does:** Companion app for Miami Science customers: log workouts, track supplement stack and supply, view order history and rewards, and (for eligible users) affiliate stats and team chat. Physical products are purchased on mia-science.com or by invoice—not in the app.

**How to sign in:** Use **Sign in** on the first screen. Enter the demo credentials below (email + password). No 2FA.

**Demo account (admin — full app + operator tools):**
- **Email:** `apple.review@miascience.com`
- **Password:** `MiamiSciAppleReview2026!`

**Important:** This user must exist in **production** Supabase. Run `supabase/seed_apple_review_admin.sql` once in the Supabase SQL Editor for the live project before review.

**After login:** You land on the home dashboard. Open **Account** to confirm role **admin**. **Admin** appears in the main navigation; open **Admin** for internal tools (integrations, affiliates, etc.). **Help** lists privacy, terms, and **support@mia-science.com**.

**Permissions:** Camera and photo library are used only if the user chooses to add progress photos in the app; wording is in the system permission dialogs.

**Offline / load failure:** If the remote app cannot load, the shell shows an in-app error page with **Try again** (Capacitor `errorPath`).

**Support:** support@mia-science.com

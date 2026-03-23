# Customer mappings — store–app linkage

How customer mappings are created, the safe matching rules, and how admins can resolve mismatches.

## Overview

A **customer mapping** links one app user (Supabase Auth `user_id`) to one WooCommerce customer (`woo_customer_id`). It is stored in `customer_mappings` with a normalized `customer_email` and a `match_source`. Orders are linked to users via this mapping (or via `tracker_user_id` on the order payload). No name-based matching is used anywhere.

## How mappings are created

1. **Backfill (imported)**  
   When you run the WooCommerce backfill (Admin → WooCommerce backfill), the job:
   - Fetches WooCommerce customers and builds a map of normalized app user email → `user_id` (from Auth).
   - For each WC customer whose email matches exactly one app user (normalized), it creates a mapping with `match_source: "imported"`.
   - Then it fetches orders and sets each order’s `user_id` from the mapping for that order’s WooCommerce `customer_id`. Orders with no mapping are stored with `user_id` null.

2. **Webhook (live orders)**  
   When the store sends an order webhook:
   - If the payload contains a valid `tracker_user_id` (UUID), that user is used and no mapping is required for that order.
   - Otherwise, the app resolves `user_id` from `customer_mappings` using the order’s `customer_id` (WooCommerce customer ID). If a mapping exists for that `woo_customer_id`, the order is linked to that user. No new mapping is created from the webhook; only existing mappings are used.

3. **Manual (admin)**  
   Admins can create or update a mapping from Admin → Customer mappings → “Create or update mapping”. You provide:
   - **User ID (UUID)** — from Supabase Auth or dashboard.
   - **WooCommerce customer ID** — from the store.
   - **Customer email** — stored normalized (lowercase, trim).
   - **Match source** — use `manual` for admin-created links.

   One mapping per user; submitting again for the same user updates that user’s mapping.

## Safe matching rules

- **Email:** Exact match only, after normalizing (lowercase, trim). Used in backfill to create mappings and in lookup; never infer a link from email alone on an incoming webhook without an existing mapping.
- **No name-based matching:** Names are never used to link customers or orders.
- **One mapping per user, one per WooCommerce customer:** Enforced by unique constraints. Linking is explicit and conservative.

## Resolving mismatches

- **Unmatched orders:** Orders with `user_id` null appear under Admin → Customer mappings → “Unmatched orders”. You can use “Find candidates” to see app user IDs whose Auth email matches the order’s customer email. This is for review only; no auto-link.
- **Linking an unmatched order:** If the candidate list shows the correct user, go to “Create or update mapping” and create a mapping with that user’s UUID, the order’s WooCommerce customer ID, and the customer email. Use match source `manual`. After saving, re-run backfill or wait for future webhooks to link existing/new orders for that customer.
- **Wrong link:** If a user was linked to the wrong store customer, update the mapping with the correct `woo_customer_id` and `customer_email` via “Create or update mapping” (same user_id, new WooCommerce ID and email). Optionally fix already-imported orders by re-running backfill (idempotent) or by updating orders in the database if you have a one-off fix.
- **Unlinking:** There is no “delete mapping” in the UI. To remove a link, delete or update the row in `customer_mappings` via Supabase dashboard or SQL if needed. Orders that were already linked keep their `user_id` unless you clear it or re-run backfill.

## Runbook summary

| Goal | Action |
|------|--------|
| See who is linked | Account page (user) or Admin → Customer mappings → Inspect (by user ID, Woo ID, or email). |
| See linked vs unmatched orders | Admin → Customer mappings → Order linkage diagnostics. |
| Find candidates for an unmatched order | Admin → Customer mappings → Unmatched orders → “Find candidates” for that row. |
| Link a user to a store customer | Admin → Customer mappings → Create or update mapping (user_id, woo_customer_id, customer_email, match_source=manual). |
| Re-link after a mistake | Same form: same user_id, correct woo_customer_id and customer_email. |
| Bulk historical link | Run WooCommerce backfill (creates mappings by email match and links orders). |

# Notification job — production

How to run scheduled notifications (reorder reminders, comeback reminders, weekly recap) in production.

## Overview

- **Runner:** `POST` or `GET /api/cron/notifications`
- **Auth:** Bearer token in `Authorization` header, or `?secret=<secret>` for GET (e.g. cron services that only support GET).
- **Behavior:** Gathers candidates (from preferences + attention/recap logic), sends email via Resend, logs every outcome to `notification_log`. Weekly recap is throttled to at most once per user per week.

## Production readiness checklist

- [ ] **Env vars:** `NOTIFICATION_CRON_SECRET` or `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **Resend:** Account created, API key created, domain or sender verified
- [ ] **From address:** `EMAIL_FROM` set to a verified sender in Resend (e.g. `notifications@yourdomain.com`)
- [ ] **Cron secret:** Long random string set as `NOTIFICATION_CRON_SECRET`; never exposed to client or logs
- [ ] **First test:** Trigger job once manually (POST with Bearer token or GET with `?secret=`); check 200 and `summary` counts
- [ ] **Verify sends:** In Resend dashboard check sent emails; in app Admin → Notification test → Recent sends check `notification_log` (sent/failed/skipped, Test vs Scheduled)

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NOTIFICATION_CRON_SECRET` or `CRON_SECRET` | Yes (to enable route) | Secret for `Authorization: Bearer <secret>` or `?secret=<secret>`. Use a long random string. |
| `RESEND_API_KEY` | Yes (for real email) | Resend.com API key. Without it, the job runs but emails are not sent (no-op). |
| `EMAIL_FROM` | Recommended | From address for emails (e.g. `notifications@yourdomain.com`). Defaults to `notifications@mia-science.com` if unset. |
| `NEXT_PUBLIC_APP_URL` | Recommended | Base URL for links in emails (e.g. `https://app.yourdomain.com`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-only). Used by the cron route to run the job. |

## Triggering the job

### Cron (recommended)

Call the route on a schedule, e.g. once per day in the morning (e.g. 09:00 UTC).

**POST with Bearer token (preferred):**

```bash
curl -X POST "https://your-app.com/api/cron/notifications" \
  -H "Authorization: Bearer YOUR_NOTIFICATION_CRON_SECRET"
```

**GET with query param** (for cron services that only support GET):

```bash
curl "https://your-app.com/api/cron/notifications?secret=YOUR_NOTIFICATION_CRON_SECRET"
```

**Vercel:** Optional `vercel.json` includes a cron entry for `/api/cron/notifications` (daily 09:00 UTC). Vercel Cron sends GET without custom headers; to authenticate, use an external cron service that can send the Bearer header, or call GET with `?secret=` (set `CRON_SECRET` in Vercel env and ensure the cron URL is not logged).

**External cron (cron-job.org, GitHub Actions, etc.):** Store the secret in the service’s secrets and pass it as `Authorization: Bearer <secret>` (POST) or `?secret=<secret>` (GET).

**Scheduling config:** The repo includes `vercel.json` with a cron entry for `/api/cron/notifications` at `0 9 * * *` (daily 09:00 UTC). On other platforms, schedule the same path using your cron or job runner; no code change needed.

### Manual run

Same as above: POST with Bearer header or GET with `?secret=`.

## Response

- **200:** `{ "ok": true, "summary": { "reorder": { "candidates", "sent", "skipped", "failed" }, "comeback": { ... }, "weekly_recap": { "candidates", "sent", "skipped", "failed", "throttled" } } }`
- **401:** Missing or invalid secret
- **503:** Secret not set (cron not configured)
- **500:** Server error (body contains `error` message)

## Resend and from address

- Emails are sent through [Resend](https://resend.com) when `RESEND_API_KEY` is set.
- Set `EMAIL_FROM` to a verified sender in Resend (e.g. `notifications@yourdomain.com`).
- Without `RESEND_API_KEY`, the job still runs and logs outcomes but does not send mail (useful for dry runs or staging).

## Throttling and log

- **Weekly recap:** At most one email per user per calendar week (UTC). Enforced via `notification_log`.
- **Reorder / comeback:** No built-in throttle; candidates are driven by current attention state and preferences.
- All attempts are written to `notification_log` (status: `sent`, `skipped`, `failed`) for audit and debugging. Admins can view recent entries under Admin → Notification test → Recent sends.

## Security

- Do not expose `NOTIFICATION_CRON_SECRET` or `CRON_SECRET` to the client or in logs.
- Use HTTPS in production so the Bearer token (or query secret) is not sent in the clear.
- The route does not require a logged-in user; it is protected only by the shared secret.
- Prefer Bearer header over `?secret=` when the caller can set headers (avoids secret in URL/logs).

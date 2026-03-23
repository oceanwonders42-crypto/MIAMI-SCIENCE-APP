# Miami Science Tracker — Product roadmap

**Role:** Product strategist / senior app architect.  
**Scope:** Organize brainstormed features into a clear roadmap, priority, and nav. No code.

---

## 1. PRODUCT POSITIONING

**One sentence:** Miami Science Tracker is the daily companion for Miami Science customers to log workouts and supplements, see progress, reorder at the right time, and stay connected to the community—without giving medical or dosing advice.

---

## 2. MUST HAVE NOW

Features that complete the MVP promise, drive retention or revenue quickly, or unblock trust with minimal scope.

| Feature | Why it matters |
|--------|-----------------|
| **Daily check-in** | Single tap (e.g. “I took my stack today” or mood/energy 1–5). Creates habit and a reason to open the app daily. |
| **Streaks** | Surfaces existing workout streak and extends to check-in streak. Visible on dashboard and profile. Low effort, high stickiness. |
| **Low supply alerts** | You already have “low supply” logic and dashboard widget. Add in-app alert/notification when a supply is low so users refill before runout. Direct driver of repeat orders. |
| **Supply runout forecast** | “Runs out in ~12 days” based on current usage. Complements low supply; gives a clear refill cue and reduces drop-off. |
| **Points history** | Rewards page shows balance and ledger. Making “points history” explicit (earned/redeemed/adjusted with dates) builds trust and reduces support. |
| **Announcements** | Admin placeholder exists. Ship a simple announcements feed or banner (e.g. new product, shipping delay). Keeps users informed without building a full CMS. |
| **Reorder reminders / comeback nudges** | “You haven’t logged in X days” or “Time to reorder?” based on last order or supply forecast. Retention and revenue; can start as simple push or in-app nudge. |

**Why this group:** These close gaps between “I have data” and “the app tells me when to act,” and between “I have points” and “I see where they came from.” They maximize retention and repeat orders with limited build.

---

## 3. SHOULD BUILD NEXT

Growth features that deepen engagement, differentiate the app, and support affiliate/revenue without overbuilding.

| Feature | Why it matters |
|--------|-----------------|
| **Workout improvements** | Exercise history, PR tracker, sets/reps/weight logging. Turns “workout done” into “what I lifted and how I’m improving.” Core tracker value. |
| **Bodyweight trend** | Simple weight-over-time chart. Fits body metrics schema you have; no medical framing. |
| **Measurements** | Waist, etc. Optional fields; progress only. |
| **Progress photos** | Private before/after or timeline. High perceived value for adherence. |
| **Recovery notes** | Sleep, soreness, hydration, energy (short notes or scales). Enriches progress context without claiming to be health advice. |
| **“My Stack” screen** | Dedicated view of current supplements (name, amount, runout, refill CTA). Makes “stack” a first-class concept. |
| **Shipment-to-inventory update** | When a shipment is “delivered,” optionally bump supply quantity or mark “refilled.” Connects order/shipment to supply reality. |
| **Refill timing / buy again** | From orders or supply forecast: “Reorder in 7 days” or “Buy again” deep link to store. Revenue. |
| **Real product catalog** | Read-only product list from store (API) so “refill” and “buy again” point to real SKUs. No cart yet. |
| **Favorites** | Save products for quick “buy again.” Supports catalog. |
| **Bundles/stacks (store)** | If store has bundles, show “recommended stack” or bundle in app. Discovery + basket size. |
| **Referral rewards** | Clarify how points are earned per referral; surface in rewards + affiliate. Already have referred orders. |
| **Referred order feed** | Affiliate dashboard already shows referred orders; make it a clear, chronological feed with status. |
| **Coupon performance** | Affiliate view: how many used my coupon, revenue attributed. Supports creator/affiliate value. |
| **Payout visibility** | Affiliate: see payout status, history, next payout. Trust and retention of affiliates. |
| **FAQ / help center** | Static or simple CMS: account, orders, rewards, affiliate, community. Reduces support and friction. |
| **Moderated topic rooms** | Community already has rooms and moderation. Add topic-based rooms (e.g. by product or goal) with same moderation. |
| **Weekly recap** | Email or in-app: “This week you did X workouts, Y check-ins, Z supplies low.” Reinforces habit and re-engagement. |
| **Monthly progress report** | Summary of workouts, check-ins, bodyweight trend, streak. Shareable or private. Differentiator. |

**Why this group:** They deepen the tracker story (progress, PRs, recovery), tie supply and orders to refill revenue, and make the affiliate path valuable and transparent—without building full ecommerce in-app.

---

## 4. LATER / ADVANCED

Higher complexity, later differentiation, or “nice to have” once core and growth are solid.

| Feature | Why later |
|--------|-----------|
| **In-app ordering / cart** | Store is separate; full cart and checkout in-app duplicate store and payment. Prefer deep links + catalog + buy again until you have a strong reason to own checkout. |
| **Affiliate creator mode** | Content vault, creator-specific perks. Do after coupon performance and payout visibility; niche until affiliate base grows. |
| **Content vault** | Gated content for affiliates or members. Useful once you have content and a clear gate (e.g. points or role). |
| **Apple Health / Google Fit / Health Connect** | Import steps, sleep, etc. High integration effort and platform rules; do after body/recovery logging is in place. |
| **Garmin / Fitbit / Oura / Whoop / Strava** | Same as above: valuable but heavy; prioritize in-app logging first. |
| **Admin sync diagnostics** | Dashboards for webhook delivery, Supabase vs store consistency. Important for ops; can follow after live webhooks are stable. |
| **Admin: featured products, reward points adjust** | Placeholders exist; implement when you need merchandising and support tools. |

**Why this group:** They either duplicate store scope, depend on a larger user base, or require significant integration work. Keep the roadmap focused on sticky behavior and repeat orders first.

---

## 5. TOP 15 FEATURES RANKED

Ranked by **retention impact**, **revenue impact**, and **implementation difficulty** (1 = easy, 5 = hard). Order is by combined strategic priority for next 6–12 months.

| # | Feature | Retention impact | Revenue impact | Implementation difficulty | Note |
|---|--------|------------------|----------------|---------------------------|------|
| 1 | Daily check-in | High | Low | 1 | Habit loop; opens app daily. |
| 2 | Streaks | High | Low | 1 | Surfaces existing + check-in streak. |
| 3 | Low supply alerts | High | High | 2 | Notifications + existing low-supply logic. |
| 4 | Supply runout forecast | High | High | 2 | Usage + remaining quantity; you have the data. |
| 5 | Reorder reminders / comeback nudges | High | High | 2 | Time since order or login; simple rules. |
| 6 | Points history | Medium | Low | 1 | Clarify UI on existing ledger. |
| 7 | Announcements | Medium | Low | 1 | Admin placeholder → simple feed/banner. |
| 8 | Refill timing / buy again | Medium | High | 2 | Links + optional catalog; no cart. |
| 9 | “My Stack” screen | High | Medium | 2 | Dedicated screen over existing supply data. |
| 10 | Exercise history / sets-reps-weight / PR tracker | High | Low | 3 | Core tracker upgrade; schema and UI. |
| 11 | Bodyweight trend | High | Low | 2 | Chart over body_metrics. |
| 12 | Shipment-to-inventory update | Medium | Medium | 3 | When shipment delivered → update supply. |
| 13 | Real product catalog + favorites | Medium | High | 3 | Store API; read-only list + favorites. |
| 14 | Weekly recap | High | Low | 2 | Email or in-app summary. |
| 15 | Payout visibility (affiliate) | Medium | Medium | 2 | Affiliate trust; status + history. |

**Takeaway:** Top 1–7 are high impact and low–medium difficulty; they form the best “next phase.” 8–15 deepen retention and revenue with slightly more build.

---

## 6. BEST NEXT BUILD PHASE

**Phase: “Habits & refill” — daily check-in, streaks, low supply alerts, runout forecast, reorder/comeback nudges, points history, announcements.**

**Why this phase first:**
- **Daily check-in + streaks** make the app a daily habit with minimal scope.
- **Low supply alerts + runout forecast + reorder/comeback nudges** directly drive “reorder at the right time” and repeat revenue.
- **Points history + announcements** complete trust and communication with small, defined work.
- No new integrations, no new store flows—only better use of existing auth, supply, orders, rewards, and notifications.
- Aligns with your rules: tracking, logging, retention, repeat orders, practical scope.

After this, the next logical phase is **“Progress & stack”**: workout improvements (sets/reps/weight, PRs, exercise history), bodyweight trend, “My Stack” screen, and optional shipment-to-inventory update.

---

## 7. FINAL APP NAV STRUCTURE

**Recommended tab bar (5 tabs, mobile-first):**

| Tab | Label | Content |
|-----|--------|--------|
| 1 | **Home** | Dashboard: check-in CTA, streak, workouts this week, supplies (low/runout), orders/shipments snapshot, rewards balance, announcements. |
| 2 | **Train** | Workouts (and later: exercise history, sets/reps/weight, PRs). Single place for training. |
| 3 | **Stack** | “My Stack” view: current supplies, runout forecast, low supply alerts, refill/buy again. Can merge with current “Stack” supply list. |
| 4 | **Orders** | Orders + shipments (current orders page). Optional: rewards entry point or tab 5. |
| 5 | **More** | Profile/account, rewards (if not in Home), community, affiliate (if role), help/FAQ, announcements archive, settings. |

**Alternate (if you want Rewards as its own tab):** Home | Train | Stack | **Rewards** | More. Then Orders live under More or as a section on Home. Prefer keeping Orders as a tab if “see my order” is a frequent action; otherwise Rewards tab can increase points visibility.

**One-line nav summary:** Bottom tabs: **Home** (dashboard + check-in) → **Train** (workouts) → **Stack** (supplies + refill) → **Orders** (or **Rewards**) → **More** (account, community, affiliate, help). Keep primary actions in 1–2 taps from Home.

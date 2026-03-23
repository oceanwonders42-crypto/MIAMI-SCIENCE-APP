# Exercise library — next content batch (launch polish)

Based on current library status: 32 exercises, 8 featured with men’s + women’s images, 24 with letter placeholder.

---

## 1. NEXT 12 EXERCISES TO ADD IMAGES FOR

Add images (men’s + women’s in same style as featured 8, or single set + Admin URL) for these, in this order:

| # | Slug | Name | Why |
|---|------|------|-----|
| 1 | incline-bench-press | Incline Bench Press | Main chest variant; high recognition |
| 2 | push-up | Push-Up | Universal, no equipment |
| 3 | romanian-deadlift | Romanian Deadlift | Common hinge; pairs with deadlift |
| 4 | leg-press | Leg Press | Common machine; strong leg option |
| 5 | lat-pulldown | Lat Pulldown | Main back machine |
| 6 | lateral-raise | Lateral Raise | Primary shoulder isolation |
| 7 | leg-curl | Leg Curl | Common leg isolation |
| 8 | barbell-curl | Barbell Curl | Primary bicep move |
| 9 | tricep-pushdown | Tricep Pushdown | Primary tricep move |
| 10 | crunch | Crunch | Core staple |
| 11 | cable-fly | Cable Fly | Chest isolation |
| 12 | calf-raise | Calf Raise | Leg finish; quick win |

**Naming:** Use same convention as featured 8: `exercise-{slug}.png` and `exercise-{slug}-women.png` in `public/exercises/`, or set **Image URL** in Admin for each.

---

## 2. NEXT 4 EXERCISES TO FEATURE

Set **display_order** in Admin (or migration) so these appear right after the current 8 on Training home and Browse. Use order **9–12**:

| display_order | Slug | Name |
|---------------|------|------|
| 9 | incline-bench-press | Incline Bench Press |
| 10 | push-up | Push-Up |
| 11 | romanian-deadlift | Romanian Deadlift |
| 12 | leg-press | Leg Press |

**SQL (optional, run after exercises exist):**

```sql
UPDATE exercises SET display_order = 9  WHERE slug = 'incline-bench-press';
UPDATE exercises SET display_order = 10 WHERE slug = 'push-up';
UPDATE exercises SET display_order = 11 WHERE slug = 'romanian-deadlift';
UPDATE exercises SET display_order = 12 WHERE slug = 'leg-press';
```

Result: first 12 on Training home are these + the current featured 8; stronger “hero” set without touching the rest of the library.

---

## 3. EXERCISES SAFE TO LEAVE AS PLACEHOLDERS FOR BETA

Keep letter placeholder (no image) for launch; add images later if needed.

**Strength — isolation / lower traffic**

- front-raise  
- face-pull  
- hammer-curl  
- skull-crusher  
- russian-twist  
- hanging-leg-raise  

**Cardio** (no single “pose” image; letter is acceptable)

- running  
- cycling  
- rowing-machine  
- jump-rope  

**Mobility** (stretch/move; letter or simple icon is fine for beta)

- hip-mobility  
- shoulder-mobility  
- cat-cow  

**Total:** 12 exercises. All already have short descriptions; no change required for beta.

---

## 4. CONTENT PRIORITY ORDER

Do in this order for launch:

1. **Feature the next 4** — Set display_order 9–12 for incline-bench-press, push-up, romanian-deadlift, leg-press (SQL or Admin). No new assets.
2. **Add images for the same 4** — Create or source images for those 4 so the first 12 cards all have images. Highest impact.
3. **Add images for the next 8** — lat-pulldown, lateral-raise, leg-curl, barbell-curl, tricep-pushdown, crunch, cable-fly, calf-raise. Improves browse and detail.
4. **Leave the remaining 12 as placeholders** — front-raise, face-pull, hammer-curl, skull-crusher, russian-twist, hanging-leg-raise, running, cycling, rowing-machine, jump-rope, hip-mobility, shoulder-mobility, cat-cow. Revisit post-beta if needed.

---

## 5. SIMPLE LAUNCH CONTENT PLAN

- **Before launch**
  - Set **display_order** 9–12 for: incline-bench-press, push-up, romanian-deadlift, leg-press.
  - Add images for at least those 4 (and ideally the full “next 12” list) so the first screen and browse feel complete.
  - Leave the 12 “safe placeholder” exercises as-is; confirm descriptions are in place (migration 00023).

- **At launch**
  - 8 featured + 4 new featured = 12 exercises with display_order and (ideally) images.
  - Up to 12 more with images if the “next 12” batch is done; otherwise letter placeholder.
  - 12 exercises intentionally left as placeholders for beta.

- **After beta**
  - Add images for placeholder Strength exercises if usage or feedback justifies it.
  - Optionally add display_order for 1–2 more “hero” exercises (e.g. lat-pulldown, lateral-raise).

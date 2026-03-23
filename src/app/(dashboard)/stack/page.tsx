import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import {
  getSupplies,
  isLowSupply,
  isRunningLowSoon,
} from "@/lib/supplies";
import { getRefillSummary } from "@/lib/refill-timing";
import {
  getProductLinksMap,
  getProductIdByNameMap,
  getRefillUrlForSupply,
  resolveProductIdForSupply,
} from "@/lib/refill-links";
import { getProductsByIds } from "@/lib/products";
import { getProfile } from "@/lib/profile";
import { calendarDateInTimeZone, formatCalendarDateLabel } from "@/lib/calendar-date";
import { getTakenSupplyIdsForDate } from "@/lib/supply-daily-logs";
import { Header } from "@/components/layout/Header";
import { ROUTES, SHOP_REFILL_URL } from "@/lib/constants";
import { SupplyForm } from "./supply-form";
import { SupplyRow } from "./SupplyRow";
import { StackOpenAddFromQuery } from "./StackOpenAddFromQuery";
import { StackDailyChecklist } from "./StackDailyChecklist";
import { Disclaimer } from "@/components/ui/Disclaimer";

interface StackPageProps {
  searchParams?: Promise<{ inventoryUpdated?: string }>;
}

export default async function StackPage({ searchParams }: StackPageProps) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";
  const [supplies, productLinksMap, productIdByNameMap, profile, resolvedParams] = await Promise.all([
    getSupplies(supabase, userId),
    getProductLinksMap(supabase),
    getProductIdByNameMap(supabase),
    getProfile(supabase, userId),
    searchParams ?? Promise.resolve({} as { inventoryUpdated?: string }),
  ]);
  const tz = profile?.timezone?.trim() || "America/New_York";
  const todayKey = calendarDateInTimeZone(tz);
  const todayLabel = formatCalendarDateLabel(tz);
  const initialTakenIds =
    supplies.length > 0 ? await getTakenSupplyIdsForDate(supabase, userId, todayKey) : [];

  const productIds = supplies
    .map((s) => resolveProductIdForSupply(s, productIdByNameMap))
    .filter((id): id is string => id != null);
  const productMap = productIds.length > 0 ? await getProductsByIds(supabase, productIds) : new Map();
  const lowCount = supplies.filter((s) => isLowSupply(s)).length;
  const runningLowSoonCount = supplies.filter((s) => isRunningLowSoon(s)).length;
  const refillSummary = getRefillSummary(supplies);
  const showInventoryUpdatedBanner = resolvedParams?.inventoryUpdated === "1";

  return (
    <>
      <Header title="My Stack" subtitle="Supplies, checklist & refills" />
      <StackOpenAddFromQuery />
      <div className="px-4 md:px-6 pb-10 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <SupplyForm />
          <a
            href={SHOP_REFILL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors min-h-[44px] inline-flex items-center"
          >
            Shop
          </a>
        </div>

        {showInventoryUpdatedBanner && (
          <div className="rounded-[1.25rem] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <p className="text-sm font-medium text-emerald-100">
              Supply updated. Your stack and refill timing are updated.
            </p>
          </div>
        )}

        {supplies.length > 0 && (
          <div className="rounded-[1.5rem] border border-white/[0.07] bg-gradient-to-br from-zinc-900/95 via-zinc-950/90 to-emerald-950/25 p-5 shadow-xl shadow-black/25 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Stack overview
                </p>
                <p className="text-lg font-bold text-zinc-50 mt-1">All supplements</p>
              </div>
              <Link
                href={ROUTES.dashboard}
                className="text-xs font-semibold text-teal-400/90 hover:text-teal-300"
              >
                Dashboard →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Active</p>
                <p className="text-2xl font-bold tabular-nums text-zinc-100">{supplies.length}</p>
              </div>
              <div
                className={`rounded-2xl border px-3 py-3 ${
                  lowCount > 0
                    ? "border-amber-500/35 bg-amber-500/10"
                    : "border-white/[0.06] bg-black/20"
                }`}
              >
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Low</p>
                <p
                  className={`text-2xl font-bold tabular-nums ${
                    lowCount > 0 ? "text-amber-200" : "text-zinc-100"
                  }`}
                >
                  {lowCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Soon</p>
                <p className="text-2xl font-bold tabular-nums text-zinc-100">{runningLowSoonCount}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Next runout</p>
                <p className="text-sm font-bold text-zinc-100 leading-tight">
                  {refillSummary.nextRunoutDate
                    ? new Date(refillSummary.nextRunoutDate + "T12:00:00Z").toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" }
                      )
                    : "—"}
                </p>
                {refillSummary.nextRunoutSupplyName && (
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {refillSummary.nextRunoutSupplyName}
                  </p>
                )}
              </div>
            </div>
            {lowCount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5">
                <p className="text-xs text-amber-100/95">
                  {lowCount} below threshold — reorder or update quantity.
                </p>
                <a
                  href={SHOP_REFILL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-3 py-2"
                >
                  Shop
                </a>
              </div>
            )}
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Push: enable in Account notifications + device. Low-supply alerts run with the notification
              cron (max about once / 24h per user while low). Reorder reminders must stay on.
            </p>
          </div>
        )}

        {supplies.length > 0 && (
          <div className="rounded-[1.25rem] border border-white/[0.07] bg-zinc-900/40 p-4 md:p-5">
            <StackDailyChecklist
              key={`${todayKey}:${[...initialTakenIds].sort().join(",")}`}
              supplies={supplies}
              initialTakenIds={initialTakenIds}
              todayKey={todayKey}
              todayLabel={todayLabel}
            />
          </div>
        )}

        {runningLowSoonCount > 0 && lowCount === 0 && (
          <div className="rounded-[1.25rem] border border-teal-500/20 bg-teal-950/20 px-4 py-3">
            <p className="text-sm text-teal-100/90">
              {runningLowSoonCount} item{runningLowSoonCount !== 1 ? "s" : ""} may run out within ~2 weeks.
              Plan a refill or adjust daily use estimates.
            </p>
          </div>
        )}

        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 mb-3 px-0.5">
            Your supplies
          </p>
          {supplies.length === 0 ? (
            <div className="rounded-[1.25rem] border border-white/[0.06] bg-zinc-900/40 py-12 px-4 text-center space-y-4">
              <p className="text-sm text-zinc-500">
                No supply items yet. Add items to track quantity, see level bars, daily checklist, and
                alerts.
              </p>
              <a
                href={SHOP_REFILL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-5 text-sm"
              >
                Browse shop
              </a>
            </div>
          ) : (
            <ul className="space-y-4">
              {supplies.map((s) => {
                const productId = s.product_id ?? resolveProductIdForSupply(s, productIdByNameMap);
                const product = productId ? productMap.get(productId) ?? null : null;
                return (
                  <li key={s.id}>
                    <SupplyRow
                      supply={s}
                      refillUrl={getRefillUrlForSupply(
                        s,
                        productLinksMap,
                        SHOP_REFILL_URL,
                        productIdByNameMap
                      )}
                      product={product}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Disclaimer compact variant="stack" className="text-center" />
      </div>
    </>
  );
}

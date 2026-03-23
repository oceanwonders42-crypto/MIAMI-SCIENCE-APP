import type { Order } from "@/types";
import type { Shipment } from "@/types";
import {
  computeTimelineStep,
  type TimelineStep,
} from "@/lib/order-status-ui";

const STEPS: { key: TimelineStep; label: string }[] = [
  { key: "placed", label: "Placed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

function stepIndex(step: TimelineStep): number {
  const i = STEPS.findIndex((s) => s.key === step);
  return i >= 0 ? i : 0;
}

export function OrderStatusTimeline({
  order,
  shipments,
}: {
  order: Order;
  shipments: Shipment[];
}) {
  const current = computeTimelineStep(order, shipments);
  const activeIdx = stepIndex(current);

  return (
    <div className="pt-1">
      <div className="flex items-center justify-between gap-1 text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
        <span>Progress</span>
      </div>
      <div className="flex items-stretch gap-0">
        {STEPS.map((s, i) => {
          const done = i <= activeIdx;
          const isLast = i === STEPS.length - 1;
          return (
            <div key={s.key} className="flex min-w-0 flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                <div
                  className={
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-colors " +
                    (done
                      ? "border-sky-500/80 bg-sky-500/20 text-sky-100"
                      : "border-zinc-700 bg-zinc-900 text-zinc-600")
                  }
                  aria-current={i === activeIdx ? "step" : undefined}
                >
                  {i + 1}
                </div>
                <span
                  className={
                    "truncate text-center text-[10px] font-medium leading-tight px-0.5 " +
                    (done ? "text-zinc-200" : "text-zinc-600")
                  }
                >
                  {s.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={
                    "h-0.5 flex-1 min-w-[8px] self-start mt-[13px] -mx-0.5 rounded " +
                    (i < activeIdx ? "bg-sky-600/50" : "bg-zinc-800")
                  }
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

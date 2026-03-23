import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** When true, section title is smaller/lighter for lower-priority blocks. */
  muted?: boolean;
}

/** Premium dashboard section: strong hierarchy, compact title. */
export function DashboardSection({
  title,
  action,
  children,
  className,
  muted,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2
          className={cn(
            "uppercase tracking-wider",
            muted
              ? "text-[11px] font-medium text-zinc-500"
              : "text-xs font-semibold text-zinc-500"
          )}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

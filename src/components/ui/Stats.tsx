import { cn } from "@/lib/utils";

interface StatsProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  className?: string;
  /** Optional class for the value (e.g. truncate for long text). */
  valueClassName?: string;
}

export function Stats({ label, value, trend, subtitle, className, valueClassName }: StatsProps) {
  return (
    <div className={cn("space-y-0.5 min-w-0", className)}>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
      </p>
      <p className={cn("text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100", valueClassName)}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      )}
      {trend && (
        <span
          className={cn(
            "text-xs font-medium",
            trend === "up" && "text-green-600 dark:text-green-400",
            trend === "down" && "text-red-600 dark:text-red-400",
            trend === "neutral" && "text-zinc-500"
          )}
        >
          {trend === "up" && "↑"}
          {trend === "down" && "↓"}
          {trend === "neutral" && "→"}
        </span>
      )}
    </div>
  );
}

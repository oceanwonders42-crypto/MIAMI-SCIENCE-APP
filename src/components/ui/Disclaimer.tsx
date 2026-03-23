import { DISCLAIMER, STACK_DISCLAIMER } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface DisclaimerProps {
  className?: string;
  compact?: boolean;
  /** Use stack/supply disclaimer (no dosing, not medical advice). */
  variant?: "default" | "stack";
}

export function Disclaimer({ className, compact, variant = "default" }: DisclaimerProps) {
  const text = variant === "stack" ? STACK_DISCLAIMER : DISCLAIMER;
  return (
    <p
      className={cn(
        "text-zinc-500 dark:text-zinc-400",
        compact ? "text-xs" : "text-sm",
        className
      )}
    >
      {text}
    </p>
  );
}

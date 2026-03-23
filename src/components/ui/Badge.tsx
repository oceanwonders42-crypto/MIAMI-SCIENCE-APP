import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  default:
    "bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200",
  success: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
  warning: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300",
  error: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
  outline: "border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 bg-transparent",
};

export function Badge({ variant = "default", children, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

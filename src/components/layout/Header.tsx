import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backHref?: string;
  className?: string;
}

export function Header({ title, subtitle, action, backHref, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 py-5 px-4 md:px-6 border-b border-zinc-800/80",
        className
      )}
    >
      <div className="min-w-0 flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="flex-shrink-0 rounded-lg p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-zinc-500 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
}

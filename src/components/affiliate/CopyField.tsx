"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyField({
  label,
  value,
  className,
  variant = "default",
}: {
  label: string;
  value: string;
  className?: string;
  /** `hero` — larger monospace for referral code / important copy. */
  variant?: "default" | "hero";
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn(label ? "space-y-2" : "", className)}>
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      ) : null}
      <div className="flex flex-wrap gap-2 items-center">
        <code
          className={cn(
            "flex-1 min-w-0 rounded-lg bg-zinc-950/80 border border-zinc-800 text-amber-100/95 truncate px-3 py-2",
            variant === "hero"
              ? "text-xl sm:text-2xl md:text-3xl font-black tracking-wide py-3 sm:py-4"
              : "text-sm"
          )}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 font-semibold text-amber-200 hover:bg-amber-500/20 transition-colors",
            variant === "hero"
              ? "px-5 py-3.5 text-base min-h-[52px]"
              : "px-3 py-2 text-sm"
          )}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

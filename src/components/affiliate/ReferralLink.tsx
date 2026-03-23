"use client";

import { useState } from "react";

interface ReferralLinkProps {
  url: string;
  label?: string;
}

export function ReferralLink({ url, label = "Referral link" }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select and show message
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <code className="flex-1 min-w-0 text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 rounded truncate">
          {url}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

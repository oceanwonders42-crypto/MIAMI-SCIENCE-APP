"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewReportAction } from "./actions";

interface ReportActionsProps {
  reportId: string;
}

export function ReportActions({ reportId }: ReportActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleReview() {
    setLoading("reviewed");
    await reviewReportAction(reportId, "reviewed");
    setLoading(null);
    router.refresh();
  }

  async function handleDismiss() {
    setLoading("dismissed");
    await reviewReportAction(reportId, "dismissed");
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleReview}
        disabled={!!loading}
        className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-2 py-1 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading === "reviewed" ? "…" : "Mark reviewed"}
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        disabled={!!loading}
        className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-2 py-1 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading === "dismissed" ? "…" : "Dismiss"}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reportMessageAction } from "./actions";

interface ReportButtonProps {
  messageId: string;
  roomId: string;
}

export function ReportButton({ messageId, roomId }: ReportButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await reportMessageAction(messageId, reason, roomId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setReason("");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
      >
        Report
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 w-full max-w-sm shadow-lg">
            <h3 className="font-semibold mb-2">Report message</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              Provide a brief reason. Moderators will review.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason..."
                rows={2}
                required
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-sm text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white py-2 text-sm disabled:opacity-50"
                >
                  {loading ? "Submitting…" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moderateChatMessageAction } from "./actions";

export function MessageModerationActions({
  messageId,
  isHidden,
  isDeleted,
}: {
  messageId: string;
  isHidden: boolean;
  isDeleted: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"hide" | "unhide" | "delete" | null>(null);

  async function run(action: "hide" | "unhide" | "delete") {
    const reason =
      action === "unhide"
        ? null
        : window.prompt("Moderation reason (optional):", "")?.trim() || null;
    setBusy(action);
    await moderateChatMessageAction({ messageId, action, reason });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {!isDeleted && (
        <button
          type="button"
          onClick={() => void run(isHidden ? "unhide" : "hide")}
          disabled={busy !== null}
          className="text-[11px] font-medium text-amber-500 hover:text-amber-400 disabled:opacity-50"
        >
          {busy === "hide" || busy === "unhide" ? "…" : isHidden ? "Unhide" : "Hide"}
        </button>
      )}
      {!isDeleted && (
        <button
          type="button"
          onClick={() => void run("delete")}
          disabled={busy !== null}
          className="text-[11px] font-medium text-red-500 hover:text-red-400 disabled:opacity-50"
        >
          {busy === "delete" ? "…" : "Delete"}
        </button>
      )}
    </div>
  );
}

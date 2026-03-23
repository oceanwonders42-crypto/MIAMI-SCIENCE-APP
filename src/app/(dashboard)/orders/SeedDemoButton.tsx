"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { seedDemoCommerceData } from "./actions";

const ALLOW_DEMO =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_ALLOW_DEMO_SEED === "true";

export function SeedDemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!ALLOW_DEMO) return null;

  async function handleClick() {
    setMessage(null);
    setLoading(true);
    const result = await seedDemoCommerceData();
    setLoading(false);
    if (result.success) {
      setMessage(result.message);
      router.refresh();
    } else {
      setMessage(result.error);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg border border-amber-700/60 bg-amber-950/30 text-amber-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Adding…" : "Add demo data"}
      </button>
      {message && (
        <p className="text-xs text-zinc-400">{message}</p>
      )}
    </div>
  );
}

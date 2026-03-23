"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { ROUTES } from "@/lib/constants";

interface BrowseSearchProps {
  /** Current query from server (for controlled initial). */
  initialQuery?: string | null;
  placeholder?: string;
}

export function BrowseSearch({
  initialQuery = "",
  placeholder = "Search…",
}: BrowseSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery ?? "");

  const apply = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      p.set("q", value.trim());
    } else {
      p.delete("q");
    }
    const qs = p.toString();
    router.push(ROUTES.trainingBrowse + (qs ? `?${qs}` : ""));
  }, [value, searchParams, router]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="flex gap-2"
    >
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search exercises"
        className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-800/80 px-4 py-3.5 text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[52px]"
      />
      {value.trim() && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            const p = new URLSearchParams(searchParams.toString());
            p.delete("q");
            const qs = p.toString();
            router.push(ROUTES.trainingBrowse + (qs ? `?${qs}` : ""));
          }}
          className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-sm text-zinc-400 hover:text-zinc-200"
        >
          Clear
        </button>
      )}
    </form>
  );
}

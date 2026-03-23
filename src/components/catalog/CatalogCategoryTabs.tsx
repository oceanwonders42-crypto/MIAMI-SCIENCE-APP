"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function CatalogCategoryTabs({ categories }: { categories: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("category")?.trim() ?? "";

  function selectCategory(name: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (!name) p.delete("category");
    else p.set("category", name);
    const q = p.toString();
    router.push(q ? `/catalog?${q}` : "/catalog", { scroll: false });
  }

  if (categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin [scrollbar-color:rgba(63,63,70,0.8)_transparent]">
      <button
        type="button"
        onClick={() => selectCategory("")}
        className={cn(
          "shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
          active === ""
            ? "bg-primary-400 text-zinc-950 shadow-lg shadow-primary-900/30"
            : "border border-white/[0.1] bg-zinc-900/50 text-zinc-400 hover:border-primary-500/25 hover:text-zinc-200"
        )}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => selectCategory(c)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all max-w-[200px] truncate",
            active === c
              ? "bg-primary-400 text-zinc-950 shadow-lg shadow-primary-900/30"
              : "border border-white/[0.1] bg-zinc-900/50 text-zinc-400 hover:border-primary-500/25 hover:text-zinc-200"
          )}
          title={c}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { pickProgressPhotoDataUrl } from "@/lib/capacitor/pick-progress-photo";
import { estimateMealAction, saveMealLogAction } from "./actions";
import type { MealLog } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { PROGRESS_PHOTOS_BUCKET } from "@/lib/progress-constants";
import { formatTimestampUtcEnUS } from "@/lib/date-display";

export function CaloriesClient({
  initialLogs,
  historyLoadError = false,
}: {
  initialLogs: MealLog[];
  /** True when server could not load history—distinct from an empty log */
  historyLoadError?: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [notes, setNotes] = useState("");
  const [estimateSource, setEstimateSource] = useState<"manual" | "ai">("manual");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [aiBrief, setAiBrief] = useState<string | null>(null);

  function resetForm() {
    setPreview(null);
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setNotes("");
    setEstimateSource("manual");
    setAiBrief(null);
    setMsg(null);
  }

  async function onPickNative() {
    setMsg(null);
    const dataUrl = await pickProgressPhotoDataUrl();
    if (!dataUrl) {
      setMsg("Could not read photo. Check camera / library permissions.");
      return;
    }
    setPreview(dataUrl);
    setEstimateSource("manual");
    setAiBrief(null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    setMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") {
        setPreview(r);
        setEstimateSource("manual");
        setAiBrief(null);
      }
    };
    reader.readAsDataURL(f);
  }

  async function onEstimate() {
    if (!preview) {
      setMsg("Add a meal photo first.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const r = await estimateMealAction(preview);
    setBusy(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setCalories(String(r.calories));
    setProtein(String(r.protein_g));
    setCarbs(String(r.carbs_g));
    setFat(String(r.fat_g));
    setEstimateSource("ai");
    setAiBrief(r.brief || "AI estimate — verify before saving.");
  }

  async function onSave() {
    const c = parseInt(calories, 10);
    if (!Number.isFinite(c) || c < 0) {
      setMsg("Enter a valid calorie total.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const r = await saveMealLogAction({
      calories: c,
      protein_g: protein.trim() ? parseInt(protein, 10) : undefined,
      carbs_g: carbs.trim() ? parseInt(carbs, 10) : undefined,
      fat_g: fat.trim() ? parseInt(fat, 10) : undefined,
      notes: notes.trim() || undefined,
      estimate_source: estimateSource,
      imageDataUrl: preview,
    });
    setBusy(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    resetForm();
    router.refresh();
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-4 sm:p-5 space-y-4">
        <p className="text-xs text-zinc-500 leading-relaxed">
          Estimates are for self-tracking only, not medical or nutrition advice. AI needs{" "}
          <code className="text-zinc-400">OPENAI_API_KEY</code> on the server; otherwise enter
          calories manually.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onPickNative()}
            disabled={busy}
            className="rounded-xl bg-primary-500/20 border border-primary-500/40 px-4 py-2.5 text-sm font-semibold text-primary-200 hover:bg-primary-500/30 disabled:opacity-50"
          >
            Camera / library
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-xl border border-zinc-600 bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            Upload file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onFile(e)}
          />
        </div>
        {preview && (
          <div className="relative w-full max-w-sm mx-auto aspect-square rounded-xl overflow-hidden border border-zinc-700 bg-black">
            <Image src={preview} alt="Meal preview" fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onEstimate()}
            disabled={busy || !preview}
            className="rounded-xl bg-emerald-600/25 border border-emerald-500/40 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-600/35 disabled:opacity-40"
          >
            Estimate from photo
          </button>
          <button
            type="button"
            onClick={() => setPreview(null)}
            disabled={busy}
            className="text-sm text-zinc-500 hover:text-zinc-300 px-2"
          >
            Clear photo
          </button>
        </div>
        {aiBrief && <p className="text-xs text-amber-200/90">{aiBrief}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">Calories</span>
            <input
              type="number"
              min={0}
              max={19999}
              value={calories}
              onChange={(e) => {
                setCalories(e.target.value);
                if (estimateSource === "ai") setEstimateSource("manual");
              }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
              placeholder="kcal"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">Protein g</span>
            <input
              type="number"
              min={0}
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">Carbs g</span>
            <input
              type="number"
              min={0}
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">Fat g</span>
            <input
              type="number"
              min={0}
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            placeholder="e.g. Grilled chicken salad"
          />
        </label>
        {msg && <p className="text-sm text-red-400">{msg}</p>}
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={busy}
          className="w-full rounded-xl bg-primary-500/90 text-primary-950 font-bold py-3 text-sm hover:bg-primary-400 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save to log"}
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">History</h2>
        {historyLoadError ? (
          <p
            role="alert"
            className="text-sm text-amber-200/90 rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-2.5 leading-relaxed"
          >
            Couldn&apos;t load your meal history. You can still add entries above. Refresh the page
            or try again later.
          </p>
        ) : initialLogs.length === 0 ? (
          <p className="text-sm text-zinc-500">No meals logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {initialLogs.map((log) => (
              <MealHistoryRow key={log.id} log={log} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MealHistoryRow({ log }: { log: MealLog }) {
  const [url, setUrl] = useState<string | null>(null);

  async function loadThumb() {
    if (!log.photo_storage_path || url) return;
    const supabase = createClient();
    const { data } = await supabase.storage
      .from(PROGRESS_PHOTOS_BUCKET)
      .createSignedUrl(log.photo_storage_path, 3600);
    if (data?.signedUrl) setUrl(data.signedUrl);
  }

  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 flex gap-3">
      <div className="shrink-0 w-16 h-16 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden relative">
        {log.photo_storage_path ? (
          <>
            {!url ? (
              <button
                type="button"
                onClick={() => void loadThumb()}
                className="absolute inset-0 text-[10px] text-zinc-500 p-1"
              >
                Load photo
              </button>
            ) : (
              <Image src={url} alt="" fill className="object-cover" unoptimized />
            )}
          </>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600">
            —
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-100">
          {log.calories} kcal
          {log.estimate_source === "ai" && (
            <span className="ml-2 text-[10px] font-bold uppercase text-emerald-500/90">AI</span>
          )}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          P {log.protein_g ?? "—"} · C {log.carbs_g ?? "—"} · F {log.fat_g ?? "—"}
        </p>
        {log.notes?.trim() && <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{log.notes}</p>}
        <p className="text-[10px] text-zinc-600 mt-1">{formatTimestampUtcEnUS(log.logged_at)}</p>
      </div>
    </li>
  );
}

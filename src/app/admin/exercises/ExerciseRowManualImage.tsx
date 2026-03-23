"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadExerciseImageFileAction, setExerciseImageUrlAction } from "./manual-image-actions";

type Props = {
  exerciseId: string;
  slug: string;
};

export function ExerciseRowManualImage({ exerciseId, slug }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function showFlash(type: "ok" | "err", text: string) {
    setFlash({ type, text });
    if (type === "ok") {
      window.setTimeout(() => setFlash(null), 4000);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setFlash(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadExerciseImageFileAction(exerciseId, fd);
    setBusy(false);
    if (!res.ok) {
      showFlash("err", res.error);
      return;
    }
    showFlash("ok", "Image uploaded and saved.");
    router.refresh();
  }

  async function onApplyUrl(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFlash(null);
    const res = await setExerciseImageUrlAction(exerciseId, urlDraft);
    setBusy(false);
    if (!res.ok) {
      showFlash("err", res.error);
      return;
    }
    setUrlDraft("");
    showFlash("ok", "Image URL saved.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        className="hidden"
        onChange={onFileChange}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="text-left text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
      >
        {busy ? "Working…" : "Upload image"}
      </button>
      <form onSubmit={onApplyUrl} className="flex flex-col gap-1">
        <input
          type="url"
          value={urlDraft}
          onChange={(ev) => setUrlDraft(ev.target.value)}
          placeholder="Or paste image URL"
          disabled={busy}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-xs"
        />
        <button
          type="submit"
          disabled={busy || !urlDraft.trim()}
          className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
        >
          Save URL
        </button>
      </form>
      <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-mono leading-tight">
        Storage: {slug}.jpg / .png
      </p>
      {flash && (
        <p
          className={
            flash.type === "ok"
              ? "text-xs text-green-700 dark:text-green-400"
              : "text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap break-words"
          }
        >
          {flash.text}
        </p>
      )}
    </div>
  );
}

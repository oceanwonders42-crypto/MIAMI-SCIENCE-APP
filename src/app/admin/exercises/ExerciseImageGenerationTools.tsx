"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateExerciseImageAction } from "./image-actions";
import type { Exercise } from "@/types";

type Props = {
  exercises: Pick<Exercise, "id" | "name" | "slug" | "image_url">[];
  initialConfigured: boolean;
  initialProvider: string;
};

export function ExerciseImageGenerationTools({
  exercises,
  initialConfigured,
  initialProvider,
}: Props) {
  const router = useRouter();
  const [bulkRunning, setBulkRunning] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [rowLoading, setRowLoading] = useState<string | null>(null);

  async function runOne(id: string) {
    setLastError(null);
    setLastMessage(null);
    setRowLoading(id);
    const res = await generateExerciseImageAction(id);
    setRowLoading(null);
    if (!res.ok) {
      setLastError(res.error);
      return;
    }
    setLastMessage("Image saved.");
    router.refresh();
  }

  async function runAllSequential() {
    if (!initialConfigured) {
      setLastError(
        "Set IMAGE_GENERATION_API_KEY or OPENAI_API_KEY in the server environment (then redeploy) before generating."
      );
      return;
    }
    if (!confirm(`Generate AI images for all ${exercises.length} exercises? This may take several minutes and uses your API quota.`)) {
      return;
    }
    setBulkRunning(true);
    setLastError(null);
    setLastMessage(null);
    let ok = 0;
    let fail = 0;
    let firstError: string | null = null;
    for (const ex of exercises) {
      setRowLoading(ex.id);
      const res = await generateExerciseImageAction(ex.id);
      if (res.ok) ok += 1;
      else {
        fail += 1;
        if (!firstError) firstError = res.error;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    setRowLoading(null);
    setBulkRunning(false);
    setLastMessage(`Done: ${ok} succeeded, ${fail} failed.`);
    if (firstError) {
      setLastError(`First error (${fail} total failures): ${firstError}`);
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 p-4 mb-6">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
        AI exercise images
      </h2>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
        Uses{" "}
        <code className="rounded bg-zinc-200 dark:bg-zinc-800 px-1">IMAGE_GENERATION_API_KEY</code> (or{" "}
        <code className="rounded bg-zinc-200 dark:bg-zinc-800 px-1">OPENAI_API_KEY</code> when provider is
        openai) and{" "}
        <code className="rounded bg-zinc-200 dark:bg-zinc-800 px-1">IMAGE_GENERATION_PROVIDER</code>{" "}
        (<span className="font-mono">{initialProvider}</span>) on the server. OpenAI and Replicate store the
        returned URL; Stability uploads PNG to the{" "}
        <code className="rounded bg-zinc-200 dark:bg-zinc-800 px-1">exercise-images</code> bucket.
      </p>
      {!initialConfigured && (
        <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
          API key is not configured — set IMAGE_GENERATION_API_KEY or OPENAI_API_KEY (for DALL·E), redeploy, and
          check server logs for full OpenAI error text if calls still fail.
        </p>
      )}
      <div className="flex flex-wrap gap-2 items-center mb-3">
        <button
          type="button"
          disabled={bulkRunning}
          onClick={() => void runAllSequential()}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium px-3 py-2 disabled:opacity-50"
        >
          {bulkRunning ? "Generating…" : "Generate all images"}
        </button>
      </div>
      {lastMessage && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-2">{lastMessage}</p>
      )}
      {lastError && (
        <p className="text-xs text-red-700 dark:text-red-400 mb-2 whitespace-pre-wrap break-words max-w-full">
          {lastError}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/50">
              <th className="p-2 font-medium text-zinc-700 dark:text-zinc-300">Exercise</th>
              <th className="p-2 font-medium text-zinc-700 dark:text-zinc-300 w-32">Action</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((ex) => (
              <tr key={ex.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="p-2 text-zinc-800 dark:text-zinc-200">{ex.name}</td>
                <td className="p-2">
                  <button
                    type="button"
                    disabled={bulkRunning || rowLoading === ex.id}
                    onClick={() => void runOne(ex.id)}
                    className="text-primary-600 dark:text-primary-400 font-medium hover:underline disabled:opacity-50"
                  >
                    {rowLoading === ex.id ? "…" : "Generate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

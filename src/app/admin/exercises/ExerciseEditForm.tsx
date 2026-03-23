"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { updateExerciseAction } from "./actions";
import { ROUTES } from "@/lib/constants";
import { isValidImageUrl } from "@/lib/exercises";
import type { Exercise } from "@/types";

export function ExerciseEditForm({ exercise }: { exercise: Exercise }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const [form, setForm] = useState({
    image_url: exercise.image_url ?? "",
    category: exercise.category ?? "",
    muscle_group: exercise.muscle_group ?? "",
    description: exercise.description ?? "",
    display_order: exercise.display_order ?? "" as number | "",
  });
  const showImagePreview = isValidImageUrl(form.image_url) && !imagePreviewFailed;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const result = await updateExerciseAction(exercise.id, {
      image_url: form.image_url.trim() || null,
      category: form.category.trim() || null,
      muscle_group: form.muscle_group.trim() || null,
      description: form.description.trim() || null,
      display_order:
        form.display_order === "" || form.display_order === null
          ? null
          : Number(form.display_order),
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{exercise.name}</span>
            <span className="ml-2 font-mono text-xs text-zinc-500">{exercise.slug}</span>
          </p>
          <Link
            href={ROUTES.trainingExercise(exercise.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            View on app →
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm p-3">
              Exercise updated.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => {
                setForm((p) => ({ ...p, image_url: e.target.value }));
                setImagePreviewFailed(false);
              }}
              placeholder="https://…"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
            {showImagePreview && (
              <div className="mt-2 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden w-24 h-24 bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={form.image_url}
                  alt=""
                  onError={() => setImagePreviewFailed(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-xs text-zinc-500 mt-1">Must be http or https. Leave empty for letter placeholder.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                placeholder="e.g. Strength"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Muscle group</label>
              <input
                type="text"
                value={form.muscle_group}
                onChange={(e) => setForm((p) => ({ ...p, muscle_group: e.target.value }))}
                placeholder="e.g. Chest"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Display order</label>
            <input
              type="number"
              min={0}
              step={1}
              value={form.display_order}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  display_order: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              placeholder="Lower = first"
              className="w-32 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
            <p className="text-xs text-zinc-500 mt-1">Lower number = shown first on training home and browse. Empty = sort by name.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Short how-to or notes"
              rows={3}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 text-sm disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

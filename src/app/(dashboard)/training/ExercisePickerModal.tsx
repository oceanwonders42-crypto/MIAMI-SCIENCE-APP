"use client";

import { useState, useEffect } from "react";
import { getExerciseImageForUser, formatDifficultyLabel, isValidImageUrl } from "@/lib/exercises";
import { ExerciseIllustration } from "@/components/exercises/illustrations/ExerciseIllustration";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/types";
import type { ExerciseImageVariant } from "@/types";

interface ExercisePickerModalProps {
  exercises: Exercise[];
  exerciseImageVariant: ExerciseImageVariant;
  onSelect: (exerciseName: string) => void;
  onClose: () => void;
  /** When set, show a "Type name instead" action that closes picker and opens form with no prefill. */
  onTypeNameInstead?: () => void;
}

export function ExercisePickerModal({
  exercises,
  exerciseImageVariant,
  onSelect,
  onClose,
  onTypeNameInstead,
}: ExercisePickerModalProps) {
  const [preview, setPreview] = useState<Exercise | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      <div className="flex items-center justify-between gap-2 p-4 border-b border-zinc-800 shrink-0">
        <h2 className="text-lg font-bold text-zinc-100">Choose exercise</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 touch-manipulation active:scale-95"
          aria-label="Close"
        >
          <span className="text-xl leading-none">×</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs text-zinc-500 mb-3">Tap an exercise for a quick preview, then add it to your workout.</p>
        <div className="grid grid-cols-2 gap-3">
          {exercises.map((ex) => (
            <ExercisePickerCard
              key={ex.id}
              exercise={ex}
              variant={exerciseImageVariant}
              onOpenPreview={() => setPreview(ex)}
            />
          ))}
        </div>
        {onTypeNameInstead && (
          <p className="mt-4 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                onTypeNameInstead();
              }}
              className="text-sm text-primary-400 hover:text-primary-300 touch-manipulation"
            >
              Type name instead
            </button>
          </p>
        )}
      </div>

      {preview && (
        <ExerciseQuickViewModal
          exercise={preview}
          variant={exerciseImageVariant}
          onAdd={() => {
            onSelect(preview.name);
            setPreview(null);
            onClose();
          }}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function ExercisePickerCard({
  exercise,
  variant,
  onOpenPreview,
}: {
  exercise: Exercise;
  variant: ExerciseImageVariant;
  onOpenPreview: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getExerciseImageForUser(
    { slug: exercise.slug, image_url: exercise.image_url },
    variant
  );
  const showImage = isValidImageUrl(imageUrl) && !imageFailed;
  const sub = [exercise.category, exercise.muscle_group].filter(Boolean).join(" · ") || null;

  return (
    <button
      type="button"
      onClick={onOpenPreview}
      className={cn(
        "group text-left rounded-2xl overflow-hidden bg-zinc-900/80 border border-zinc-800",
        "shadow-lg shadow-black/20 active:scale-[0.98] touch-manipulation",
        "hover:border-zinc-700 hover:shadow-xl transition-all duration-200"
      )}
    >
      <div className="aspect-[3/4] relative bg-gradient-to-br from-zinc-800 to-zinc-900">
        {showImage ? (
          <img
            src={imageUrl!}
            alt=""
            onError={() => setImageFailed(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
          />
        ) : (
          <ExerciseIllustration
            slug={exercise.slug}
            variant="card"
            category={exercise.category}
            className="absolute inset-0"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-zinc-100 line-clamp-2 text-sm leading-tight group-hover:text-primary-400 transition-colors">
          {exercise.name}
        </h3>
        {sub && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{sub}</p>}
      </div>
    </button>
  );
}

function ExerciseQuickViewModal({
  exercise,
  variant,
  onAdd,
  onClose,
}: {
  exercise: Exercise;
  variant: ExerciseImageVariant;
  onAdd: () => void;
  onClose: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getExerciseImageForUser(
    { slug: exercise.slug, image_url: exercise.image_url },
    variant
  );
  const showImage = isValidImageUrl(imageUrl) && !imageFailed;
  const steps = exercise.steps?.filter(Boolean) ?? [];
  const previewSteps = steps.slice(0, 2);
  const diff = formatDifficultyLabel(exercise.difficulty ?? null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/10] w-full bg-zinc-900">
          {showImage ? (
            <img
              src={imageUrl!}
              alt=""
              onError={() => setImageFailed(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <ExerciseIllustration
              slug={exercise.slug}
              variant="detail"
              category={exercise.category}
              className="absolute inset-0"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-zinc-200 hover:bg-black/70 touch-manipulation"
            aria-label="Close preview"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <h3 id="quick-view-title" className="text-lg font-bold text-zinc-100">
              {exercise.name}
            </h3>
            {diff && (
              <p className="text-sm text-emerald-400/90 font-medium mt-1">{diff}</p>
            )}
          </div>
          {previewSteps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">First steps</p>
              <ol className="space-y-2">
                {previewSteps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-400">
                      {i + 1}
                    </span>
                    <span className="leading-snug pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {previewSteps.length === 0 && exercise.description?.trim() && (
            <p className="text-sm text-zinc-400 line-clamp-4">{exercise.description.trim()}</p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onAdd}
              className="flex-1 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 text-sm touch-manipulation"
            >
              Add exercise
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 touch-manipulation"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

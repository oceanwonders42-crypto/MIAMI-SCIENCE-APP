import Link from "next/link";
import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import {
  getExercisesFiltered,
  getExerciseCategories,
  getExerciseMuscleGroups,
  getExerciseImageForUser,
} from "@/lib/exercises";
import { Header } from "@/components/layout/Header";
import { ROUTES } from "@/lib/constants";
import { ExerciseCard } from "../ExerciseCard";
import { BrowseFilters } from "./BrowseFilters";
import { BrowseSearch } from "./BrowseSearch";

interface PageProps {
  searchParams: Promise<{ category?: string; muscle?: string; q?: string }>;
}

export default async function TrainingBrowsePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params.category?.trim() || null;
  const muscle = params.muscle?.trim() || null;
  const searchQuery = params.q?.trim() || null;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";
  const [exercises, categories, muscleGroups, profile] = await Promise.all([
    getExercisesFiltered(supabase, {
      category: category ?? undefined,
      muscleGroup: muscle ?? undefined,
      search: searchQuery ?? undefined,
    }),
    getExerciseCategories(supabase),
    getExerciseMuscleGroups(supabase),
    getProfile(supabase, userId),
  ]);
  const exerciseImageVariant = profile?.exercise_image_variant === "women" ? "women" : "men";

  const subtitleParts = [category, muscle].filter(Boolean);
  if (searchQuery) subtitleParts.unshift(`“${searchQuery}”`);
  const subtitle = subtitleParts.length ? subtitleParts.join(" · ") : "Full library";

  return (
    <>
      <Header
        title="Browse exercises"
        subtitle={subtitle}
        backHref={ROUTES.training}
      />
      <div className="px-4 md:px-6 pb-10">
        <Suspense fallback={<div className="h-12 rounded-2xl bg-zinc-800/50 animate-pulse mb-4" />}>
          <div className="mb-4">
            <BrowseSearch initialQuery={searchQuery} />
          </div>
        </Suspense>
        <BrowseFilters
          categories={categories}
          muscleGroups={muscleGroups}
          activeCategory={category}
          activeMuscle={muscle}
          searchQuery={searchQuery}
        />
        <section className="mt-5">
          {exercises.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 text-center">
              <p className="text-zinc-500 text-sm mb-4">No exercises match.</p>
              <Link
                href={ROUTES.trainingBrowse}
                className="inline-flex items-center justify-center rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3.5 px-5 min-h-[48px] touch-manipulation active:scale-[0.98]"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {exercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  name={ex.name}
                  slug={ex.slug}
                  imageUrl={getExerciseImageForUser({ slug: ex.slug, image_url: ex.image_url }, exerciseImageVariant)}
                  category={ex.category}
                  muscleGroup={ex.muscle_group}
                  featured={ex.display_order != null}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

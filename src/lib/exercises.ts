import type { SupabaseClient } from "@supabase/supabase-js";
import type { Exercise, ExerciseDifficulty, ExerciseImageVariant } from "@/types";
import { EXERCISE_PHOTO_PATH_OVERRIDES } from "@/lib/exerciseMedia";

/** Convert exercise name to URL slug: lowercase, spaces -> hyphens. */
export function nameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Convert slug back to display name: capitalize words. */
export function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function getExercises(
  supabase: SupabaseClient,
  limit = 200
): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Exercise[];
}

export interface ExerciseFilters {
  category?: string | null;
  muscleGroup?: string | null;
  /** Case-insensitive name search (partial match). */
  search?: string | null;
  limit?: number;
}

/** Library exercises with optional category, muscle_group, and name search. */
export async function getExercisesFiltered(
  supabase: SupabaseClient,
  filters: ExerciseFilters = {}
): Promise<Exercise[]> {
  const { category, muscleGroup, search, limit = 300 } = filters;
  let q = supabase
    .from("exercises")
    .select("*")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("category", { ascending: true, nullsFirst: false })
    .order("muscle_group", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .limit(limit);
  if (category?.trim()) {
    q = q.eq("category", category.trim());
  }
  if (muscleGroup?.trim()) {
    q = q.eq("muscle_group", muscleGroup.trim());
  }
  if (search?.trim()) {
    q = q.ilike("name", `%${search.trim()}%`);
  }
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as Exercise[];
}

/** True if value looks like a valid image URL (http/https or path). Used to avoid broken or data URLs. */
export function isValidImageUrl(value: string | null | undefined): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  const t = value.trim();
  return (
    t.startsWith("http://") ||
    t.startsWith("https://") ||
    (t.startsWith("/") && !t.startsWith("//"))
  );
}

/** Slug list for exercises that have bundled men's + women's images in public/exercises/. (First 12 have display_order; next 8 are library-only.) */
export const FEATURED_EXERCISE_SLUGS = [
  "bench-press",
  "squat",
  "deadlift",
  "pull-up",
  "overhead-press",
  "barbell-row",
  "plank",
  "lunge",
  "incline-bench-press",
  "push-up",
  "romanian-deadlift",
  "leg-press",
  "lat-pulldown",
  "lateral-raise",
  "leg-curl",
  "barbell-curl",
  "tricep-pushdown",
  "crunch",
  "cable-fly",
  "calf-raise",
] as const;

export type FeaturedExerciseSlug = (typeof FEATURED_EXERCISE_SLUGS)[number];

/**
 * Default path for a bundled exercise image (men's or women's set).
 * Use when you need a path without storing it in DB, e.g. admin defaults or future per-user variant.
 * Base path: /exercises/; naming: exercise-{slug}.png (men) or exercise-{slug}-women.png (women).
 */
export function getDefaultExerciseImagePath(
  slug: string,
  variant: "men" | "women" = "men"
): string {
  const safe = slug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!safe) return "";
  const suffix = variant === "women" ? "-women" : "";
  return `/exercises/exercise-${safe}${suffix}.png`;
}

/** Minimal exercise shape for image resolution (slug + default image_url from DB). */
export interface ExerciseForImage {
  slug: string;
  image_url: string | null;
}

function resolveBundledExercisePhotoUrl(slug: string, variant: ExerciseImageVariant): string | null {
  const safe = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!safe) return null;
  if (!FEATURED_EXERCISE_SLUGS.includes(safe as FeaturedExerciseSlug)) return null;
  const override = EXERCISE_PHOTO_PATH_OVERRIDES[safe];
  if (variant === "women") {
    const o = override?.women ?? override?.default ?? override?.men;
    if (o && isValidImageUrl(o)) return o;
    return getDefaultExerciseImagePath(safe, "women");
  }
  const o = override?.men ?? override?.default;
  if (o && isValidImageUrl(o)) return o;
  return getDefaultExerciseImagePath(safe, "men");
}

/**
 * Resolve the exercise image URL for display.
 * Priority: DB `image_url` (http(s) or app path) → optional bundled override → default bundled PNG
 * for FEATURED_EXERCISE_SLUGS (see public/exercises/README.md) → null (SVG illustration).
 */
export function getExerciseImageForUser(
  exercise: ExerciseForImage,
  variant: ExerciseImageVariant
): string | null {
  if (isValidImageUrl(exercise.image_url)) return exercise.image_url;
  return resolveBundledExercisePhotoUrl(exercise.slug, variant);
}

/** Minimal exercise row for resolving photos by name (e.g. workout entries, saved plans). */
export type ExerciseImageLookupRow = Pick<Exercise, "name" | "slug" | "image_url" | "category">;

/**
 * Resolve slug + image URL for a logged exercise name using the library list (custom names fall back to nameToSlug).
 */
export function getExerciseImageContextForName(
  exerciseName: string,
  library: readonly ExerciseImageLookupRow[],
  variant: ExerciseImageVariant
): { slug: string; imageUrl: string | null; category: string | null } {
  const key = exerciseName.trim().toLowerCase();
  const ex = library.find((e) => e.name.trim().toLowerCase() === key);
  const slug = ex?.slug ?? nameToSlug(exerciseName);
  const imageUrl = getExerciseImageForUser({ slug, image_url: ex?.image_url ?? null }, variant);
  return { slug, imageUrl, category: ex?.category ?? null };
}

/** Distinct categories from exercises table, sorted. */
export async function getExerciseCategories(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("category")
    .not("category", "is", null);
  if (error) return [];
  const set = new Set((data ?? []).map((r: { category: string }) => r.category).filter(Boolean));
  return Array.from(set).sort();
}

/** Distinct muscle_group values from exercises table, sorted. */
export async function getExerciseMuscleGroups(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("muscle_group")
    .not("muscle_group", "is", null);
  if (error) return [];
  const set = new Set((data ?? []).map((r: { muscle_group: string }) => r.muscle_group).filter(Boolean));
  return Array.from(set).sort();
}

/** First N library exercises for training home (featured/display_order first). */
export async function getExercisesPreview(
  supabase: SupabaseClient,
  limit = 6
): Promise<Exercise[]> {
  return getExercisesFiltered(supabase, { limit });
}

/** Total number of exercises (for library section "All N exercises" link). */
export async function getExercisesCount(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("exercises")
    .select("*", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

/** Single exercise by id (for admin edit). */
export async function getExerciseById(
  supabase: SupabaseClient,
  id: string
): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data as Exercise | null;
}

export async function getExerciseBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return data as Exercise | null;
}

/** Human-readable difficulty for UI. */
export function formatDifficultyLabel(d: ExerciseDifficulty | null | undefined): string | null {
  if (!d) return null;
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/** Other library exercises targeting the same muscle group (for detail page). */
export async function getRelatedExercises(
  supabase: SupabaseClient,
  muscleGroup: string | null | undefined,
  excludeSlug: string,
  limit = 4
): Promise<Exercise[]> {
  const mg = muscleGroup?.trim();
  if (!mg) return [];
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("muscle_group", mg)
    .neq("slug", excludeSlug)
    .order("name", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Exercise[];
}

export async function getExerciseByName(
  supabase: SupabaseClient,
  name: string
): Promise<Exercise | null> {
  const normalized = name.trim();
  if (!normalized) return null;
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("name", normalized)
    .maybeSingle();
  if (error) return null;
  return data as Exercise | null;
}

/** Map of exercise name (trimmed) -> Exercise for quick lookup. */
export async function getExercisesByNameMap(
  supabase: SupabaseClient
): Promise<Map<string, Exercise>> {
  const list = await getExercises(supabase);
  const map = new Map<string, Exercise>();
  for (const e of list) {
    map.set(e.name.trim().toLowerCase(), e);
  }
  return map;
}

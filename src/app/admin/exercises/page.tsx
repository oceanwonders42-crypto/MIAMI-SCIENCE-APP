import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { getExercises } from "@/lib/exercises";
import { isValidImageUrl } from "@/lib/exercises";
import { getImageGenProvider, isImageGenerationApiKeyConfigured } from "@/lib/image-generation";
import { Header } from "@/components/layout/Header";
import { ROUTES } from "@/lib/constants";
import { redirect } from "next/navigation";
import { ExerciseImageGenerationTools } from "./ExerciseImageGenerationTools";
import { ExerciseRowManualImage } from "./ExerciseRowManualImage";

export default async function AdminExercisesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") redirect(ROUTES.dashboard);

  const exercises = await getExercises(supabase, 500);
  const imageGenProvider = getImageGenProvider();
  const imageGenConfigured = isImageGenerationApiKeyConfigured(imageGenProvider);

  return (
    <>
      <Header
        title="Exercise library"
        subtitle={`${exercises.length} exercises — edit descriptions & display order`}
      />
      <div className="px-4 md:px-6 pb-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Set image URL, category, muscle group, description, and display order. Lower order = shown first on training home and browse.
        </p>
        <ExerciseImageGenerationTools
          exercises={exercises.map((e) => ({
            id: e.id,
            name: e.name,
            slug: e.slug,
            image_url: e.image_url,
          }))}
          initialConfigured={imageGenConfigured}
          initialProvider={imageGenProvider}
        />
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300 w-16">Image</th>
                <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300">Name</th>
                <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300">Category</th>
                <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300">Muscle</th>
                <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300 w-20">Order</th>
                <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300 w-44">Manual image</th>
                <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex) => (
                <tr key={ex.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="p-2">
                    {isValidImageUrl(ex.image_url) ? (
                      <img
                        src={ex.image_url!}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover bg-zinc-200 dark:bg-zinc-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold text-lg">
                        {ex.name.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{ex.name}</span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-mono">{ex.slug}</span>
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">{ex.category ?? "—"}</td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">{ex.muscle_group ?? "—"}</td>
                  <td className="p-3">
                    {ex.display_order != null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 text-xs font-medium tabular-nums">
                        Featured · {ex.display_order}
                      </span>
                    ) : (
                      <span className="text-zinc-500 dark:text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    <ExerciseRowManualImage exerciseId={ex.id} slug={ex.slug} />
                  </td>
                  <td className="p-3 align-top">
                    <Link
                      href={`/admin/exercises/${ex.id}/edit`}
                      className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {exercises.length === 0 && (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm py-8 text-center">No exercises. Run the exercise seed migration.</p>
        )}
        <p className="mt-6 text-sm">
          <Link href="/admin" className="text-primary-600 dark:text-primary-400 hover:underline">
            ← Back to admin
          </Link>
        </p>
      </div>
    </>
  );
}

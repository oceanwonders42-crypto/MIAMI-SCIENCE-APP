import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { getExerciseById } from "@/lib/exercises";
import { Header } from "@/components/layout/Header";
import { ExerciseEditForm } from "../../ExerciseEditForm";
import { ROUTES } from "@/lib/constants";

export default async function AdminExerciseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") redirect(ROUTES.dashboard);

  const exercise = await getExerciseById(supabase, id);
  if (!exercise) notFound();

  return (
    <>
      <Header title="Edit exercise" subtitle={exercise.name} />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <ExerciseEditForm exercise={exercise} />
        <p className="text-sm">
          <Link href="/admin/exercises" className="text-primary-600 dark:text-primary-400 hover:underline">
            ← Back to exercise library
          </Link>
        </p>
      </div>
    </>
  );
}

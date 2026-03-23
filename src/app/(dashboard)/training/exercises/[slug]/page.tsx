import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Alias route: `/training/exercises/[slug]` → `/training/exercise/[slug]`. */
export default async function TrainingExercisesSlugRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/training/exercise/${encodeURIComponent(slug)}`);
}

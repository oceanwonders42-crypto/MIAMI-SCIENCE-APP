import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getProfile, isProfileComplete } from "@/lib/profile";
import { ROUTES } from "@/lib/constants";

export default async function HomePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const profile = await getProfile(supabase, user.id);
  if (!isProfileComplete(profile)) redirect(ROUTES.onboarding);
  redirect(ROUTES.dashboard);
}

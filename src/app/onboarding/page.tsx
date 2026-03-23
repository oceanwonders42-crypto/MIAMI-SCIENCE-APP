import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getProfile, isProfileComplete } from "@/lib/profile";
import { ProfileForm } from "@/components/shared/ProfileForm";
import { DISCLAIMER } from "@/lib/constants";
import { ROUTES } from "@/lib/constants";

export default async function OnboardingPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const profile = await getProfile(supabase, user.id);
  if (isProfileComplete(profile)) {
    redirect(ROUTES.dashboard);
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center max-w-md mx-auto">
      <div className="space-y-6 w-full">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Welcome to Miami Science Tracker
          </h1>
          <p className="text-sm text-zinc-500">
            Complete your profile to get started. You can update this later in Account.
          </p>
        </div>
        <ProfileForm profile={profile} redirectTo={ROUTES.dashboard} submitLabel="Complete setup" />
        <p className="text-xs text-zinc-500 text-center">{DISCLAIMER}</p>
      </div>
    </div>
  );
}

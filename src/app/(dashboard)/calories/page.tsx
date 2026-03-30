import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { ROUTES } from "@/lib/constants";
import { listMealLogs } from "@/lib/meal-logs";
import { CaloriesClient } from "./CaloriesClient";

export default async function CaloriesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const { logs, loadError } = await listMealLogs(supabase, user.id);

  return (
    <>
      <Header
        title="Calories"
        subtitle="Log meals from a photo — estimates for self-tracking only"
      />
      <div className="px-4 pb-24 max-md:pb-28 md:px-6 md:pb-10">
        <CaloriesClient initialLogs={logs} historyLoadError={loadError} />
      </div>
    </>
  );
}

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") {
    redirect(ROUTES.dashboard);
  }
  return <>{children}</>;
}

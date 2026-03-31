import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { tryAutoLinkWordPressAdmin } from "@/lib/integrations/auto-wordpress-admin-link";
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

  if (user.email) {
    try {
      const serviceClient = createServiceRoleClient();
      await tryAutoLinkWordPressAdmin(serviceClient, user.id, user.email);
    } catch {
      // Keep admin gate deterministic even if external sync can't run.
    }
  }

  const role = await getRole(supabase, user.id);
  if (role !== "admin") {
    redirect(ROUTES.dashboard);
  }
  return <>{children}</>;
}

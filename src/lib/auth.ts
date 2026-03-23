import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types";

const ROLES_TABLE = "user_roles";

/**
 * Get the user's role from user_roles. Precedence: admin > affiliate > customer.
 */
export async function getRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole> {
  const { data, error } = await supabase
    .from(ROLES_TABLE)
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return "customer";
  }
  const role = data.role as UserRole;
  if (role === "admin" || role === "affiliate" || role === "customer") {
    return role;
  }
  return "customer";
}

/**
 * Check if user has at least affiliate access (affiliate or admin).
 */
export function isAffiliateOrAdmin(role: UserRole): boolean {
  return role === "affiliate" || role === "admin";
}

/**
 * Check if user is admin.
 */
export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

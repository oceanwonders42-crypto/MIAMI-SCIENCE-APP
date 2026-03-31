/**
 * Previously: auto-linked SliceWP affiliate id from email on each dashboard load.
 * Disabled — affiliate program access is ULTRA/onboarding-based only (see affiliate-access.ts).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types";

/** @deprecated No-op. Do not re-enable silent email-based SliceWP linking. */
export async function bootstrapAffiliateIdentityFromSliceEmail(
  _serviceSb: SupabaseClient,
  _userId: string,
  _email: string | null | undefined,
  _role: UserRole
): Promise<void> {}

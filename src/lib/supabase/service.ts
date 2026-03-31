/**
 * Supabase service role client — server-only. Use only in API routes or server code
 * that must bypass RLS (e.g. store webhook ingesting orders). Never expose to the client.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let serviceClient: SupabaseClient<any> | null = null;

/** Server-only client; not tied to strict generated DB types (migrations add tables frequently). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServiceRoleClient(): SupabaseClient<any> {
  if (serviceClient) return serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient = createClient<any>(url, key, { auth: { persistSession: false } });
  return serviceClient;
}

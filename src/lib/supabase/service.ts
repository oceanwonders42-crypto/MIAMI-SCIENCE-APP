/**
 * Supabase service role client — server-only. Use only in API routes or server code
 * that must bypass RLS (e.g. store webhook ingesting orders). Never expose to the client.
 */
import { createClient } from "@supabase/supabase-js";

let serviceClient: ReturnType<typeof createClient> | null = null;

export function createServiceRoleClient() {
  if (serviceClient) return serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  serviceClient = createClient(url, key, { auth: { persistSession: false } });
  return serviceClient;
}

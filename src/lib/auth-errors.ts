import type { AuthError } from "@supabase/supabase-js";

/**
 * Log Supabase Auth errors with full detail (browser console / server logs).
 * The user-facing `message` is often generic ("Database error querying schema");
 * this surfaces status, code, and the raw object in development.
 */
export function logAuthError(
  context: string,
  error: AuthError | Error | null | undefined
): void {
  if (!error) return;

  const anyErr = error as AuthError & {
    status?: number;
    code?: string;
    __isAuthError?: boolean;
  };

  console.error(`[auth] ${context}`, {
    message: anyErr.message,
    name: anyErr.name,
    status: anyErr.status,
    code: anyErr.code,
  });

  if (process.env.NODE_ENV === "development") {
    console.error(`[auth] ${context} (full error)`, error);
  }
}

/** Hint when GoTrue returns the generic DB schema error (common with SQL-seeded users). */
export function authErrorHint(message: string): string | null {
  if (
    message.includes("Database error querying schema") ||
    message.includes("converting NULL to string")
  ) {
    return "If this account was created via SQL seed, run the migration that fixes NULL auth token columns (see supabase/migrations/00033_fix_auth_users_null_token_columns.sql), or recreate users with empty-string token fields.";
  }
  return null;
}

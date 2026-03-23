-- Fix GoTrue login failure: "Database error querying schema"
-- Root cause: NULL in auth.users token columns → Go scanner error
-- ("converting NULL to string is unsupported"). Common for SQL-seeded users.
-- Ref: https://github.com/supabase/auth/issues/1940

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE confirmation_token IS NULL
   OR email_change IS NULL
   OR email_change_token_new IS NULL
   OR recovery_token IS NULL;

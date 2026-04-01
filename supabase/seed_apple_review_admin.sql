-- =============================================================================
-- Apple App Review — dedicated admin account (production Supabase)
-- =============================================================================
-- Run once in Supabase SQL Editor (Dashboard) as postgres on the PRODUCTION project.
-- Does NOT delete or modify oceanwonders42 / other seed users.
-- Idempotent: re-run deletes only this fixed user id + email, then re-inserts.
--
-- Login (paste into App Review Information):
--   Email:    apple.review@miascience.com
--   Password: MiamiSciAppleReview2026!
--
-- After login: full customer + admin UI at https://app.mia-science.com (WebView in iOS).
-- Open Account to confirm role "admin"; Admin appears in nav; /admin loads operator tools.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_email         TEXT := 'apple.review@miascience.com';
  v_password      TEXT := 'MiamiSciAppleReview2026!';
  v_encrypted_pw  TEXT := crypt(v_password, gen_salt('bf'));
  v_user_id       UUID := 'b0000001-0001-4001-8001-00000000a701'::uuid;
BEGIN
  DELETE FROM auth.users WHERE id = v_user_id OR email = v_email;

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    v_encrypted_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Apple Review","seed_account":true,"apple_review":true}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id, v_email)::jsonb,
    'email',
    v_user_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  UPDATE public.user_roles SET role = 'admin'::app_role WHERE user_id = v_user_id;

  UPDATE public.profiles
  SET
    display_name = 'Apple Review',
    full_name = 'Apple Review',
    fitness_goal = 'general_fitness',
    preferred_units = 'metric',
    timezone = 'America/New_York',
    updated_at = NOW()
  WHERE user_id = v_user_id;

  RAISE NOTICE 'Apple Review admin ready: % (password in script header)', v_email;
END $$;

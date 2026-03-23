-- =============================================================================
-- Miami Science Tracker — test auth accounts (local / staging only)
-- =============================================================================
-- Creates 3 users in auth.users + auth.identities, lets handle_new_user() create
-- profiles + user_roles (customer), then sets roles and completes profiles.
-- Optional: one affiliate_profiles row for the affiliate tester (referral UI).
--
-- BEFORE RUNNING:
--   1. Emails/password are set below for test accounts (edit if needed).
--   2. Run in Supabase SQL Editor (Dashboard) as postgres, OR include in CLI seed.
--
-- RE-RUN: Deletes existing rows with the same emails or fixed UUIDs, then re-inserts.
--
-- Default password (all three accounts): TestSeed123!
--
-- To wire into Supabase CLI seeding, add to supabase/config.toml:
--   [db.seed]
--   enabled = true
--   sql_paths = ['./seed.sql', './seed_test_accounts.sql']
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_admin_email     TEXT := 'oceanwonders42@gmail.com';
  v_affiliate_email TEXT := 'affiliate_test@miascience.com';
  v_customer_email  TEXT := 'customer_test@miascience.com';

  -- Shared test password (bcrypt). Change here if you want a different one.
  v_seed_password TEXT := 'TestSeed123!';
  v_encrypted_pw  TEXT := crypt(v_seed_password, gen_salt('bf'));

  -- Fixed UUIDs so re-runs are predictable (optional to change)
  v_admin_id    UUID := 'a0000001-0001-4001-8001-000000000001'::uuid;
  v_affiliate_id UUID := 'a0000001-0001-4001-8001-000000000002'::uuid;
  v_customer_id  UUID := 'a0000001-0001-4001-8001-000000000003'::uuid;
BEGIN
  -- Clean up previous seed (same emails or same fixed ids)
  DELETE FROM auth.users
  WHERE id IN (v_admin_id, v_affiliate_id, v_customer_id)
     OR email IN (v_admin_email, v_affiliate_email, v_customer_email);

  -- ---------------------------------------------------------------------------
  -- Admin / dev (Miami Science Team in affiliate chat when posting as admin)
  -- ---------------------------------------------------------------------------
  -- Token columns must be '' not NULL or GoTrue fails with "Database error querying schema"
  -- (see https://github.com/supabase/auth/issues/1940)
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
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_admin_email,
    v_encrypted_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Seed Admin","seed_account":true}'::jsonb,
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
    v_admin_id,
    format('{"sub":"%s","email":"%s"}', v_admin_id, v_admin_email)::jsonb,
    'email',
    v_admin_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  -- ---------------------------------------------------------------------------
  -- Affiliate (dashboard, group chat, referral link when affiliate_profiles exists)
  -- ---------------------------------------------------------------------------
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
    v_affiliate_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_affiliate_email,
    v_encrypted_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Seed Affiliate","seed_account":true}'::jsonb,
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
    v_affiliate_id,
    format('{"sub":"%s","email":"%s"}', v_affiliate_id, v_affiliate_email)::jsonb,
    'email',
    v_affiliate_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  -- ---------------------------------------------------------------------------
  -- Customer (dashboard, workouts, stack, progress, orders, rewards)
  -- ---------------------------------------------------------------------------
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
    v_customer_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_customer_email,
    v_encrypted_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Seed Customer","seed_account":true}'::jsonb,
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
    v_customer_id,
    format('{"sub":"%s","email":"%s"}', v_customer_id, v_customer_email)::jsonb,
    'email',
    v_customer_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  -- Roles: trigger created 'customer' for all — bump admin + affiliate
  UPDATE public.user_roles SET role = 'admin'::app_role WHERE user_id = v_admin_id;
  UPDATE public.user_roles SET role = 'affiliate'::app_role WHERE user_id = v_affiliate_id;

  -- Profiles: satisfy isProfileComplete (full_name + display_name) + basic onboarding fields
  UPDATE public.profiles
  SET
    display_name = 'Seed Admin',
    full_name = 'Seed Admin',
    fitness_goal = 'general_fitness',
    preferred_units = 'metric',
    timezone = 'America/New_York',
    updated_at = NOW()
  WHERE user_id = v_admin_id;

  UPDATE public.profiles
  SET
    display_name = 'Seed Affiliate',
    full_name = 'Seed Affiliate',
    fitness_goal = 'general_fitness',
    preferred_units = 'metric',
    timezone = 'America/New_York',
    updated_at = NOW()
  WHERE user_id = v_affiliate_id;

  UPDATE public.profiles
  SET
    display_name = 'Seed Customer',
    full_name = 'Seed Customer',
    fitness_goal = 'general_fitness',
    preferred_units = 'metric',
    timezone = 'America/New_York',
    updated_at = NOW()
  WHERE user_id = v_customer_id;

  -- Referral / coupon demo row for affiliate (optional; safe to delete if unused)
  INSERT INTO public.affiliate_profiles (
    user_id,
    referral_code,
    coupon_code,
    referral_link,
    status
  ) VALUES (
    v_affiliate_id,
    'SEED-AFF-TEST',
    'SEED10',
    'https://example.com/?ref=SEED-AFF-TEST',
    'active'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    referral_code = EXCLUDED.referral_code,
    coupon_code = EXCLUDED.coupon_code,
    referral_link = EXCLUDED.referral_link,
    updated_at = NOW();

  RAISE NOTICE 'Seed users created. Password for all: %', v_seed_password;
  RAISE NOTICE 'Admin:    % (%)', v_admin_email, v_admin_id;
  RAISE NOTICE 'Affiliate:% (%)', v_affiliate_email, v_affiliate_id;
  RAISE NOTICE 'Customer: % (%)', v_customer_email, v_customer_id;
END $$;

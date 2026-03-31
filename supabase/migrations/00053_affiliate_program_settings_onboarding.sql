-- Program-wide defaults (admin-editable) and per-affiliate overrides.
-- Onboarding session: unlock code verified server-side before promo provisioning.

CREATE TABLE IF NOT EXISTS public.affiliate_program_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_coupon_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 10
    CHECK (default_coupon_discount_percent >= 0 AND default_coupon_discount_percent <= 100),
  default_commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 15
    CHECK (default_commission_percent >= 0 AND default_commission_percent <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.affiliate_program_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.affiliate_program_settings ENABLE ROW LEVEL SECURITY;

-- Non-secret defaults; any logged-in user can read (locked affiliate page shows current program %).
DROP POLICY IF EXISTS "Admins read affiliate_program_settings" ON public.affiliate_program_settings;
DROP POLICY IF EXISTS "Authenticated read affiliate_program_settings" ON public.affiliate_program_settings;
CREATE POLICY "Authenticated read affiliate_program_settings"
  ON public.affiliate_program_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins update affiliate_program_settings" ON public.affiliate_program_settings;
CREATE POLICY "Admins update affiliate_program_settings"
  ON public.affiliate_program_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

ALTER TABLE public.affiliate_profiles
  ADD COLUMN IF NOT EXISTS coupon_discount_percent NUMERIC(5, 2)
    CHECK (coupon_discount_percent IS NULL OR (coupon_discount_percent >= 0 AND coupon_discount_percent <= 100)),
  ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5, 2)
    CHECK (commission_percent IS NULL OR (commission_percent >= 0 AND commission_percent <= 100));

COMMENT ON COLUMN public.affiliate_profiles.coupon_discount_percent IS
  'WooCommerce affiliate coupon percent; NULL uses affiliate_program_settings.default_coupon_discount_percent.';
COMMENT ON COLUMN public.affiliate_profiles.commission_percent IS
  'SliceWP commission percent mirrored from admin; NULL uses program default.';

-- At most one affiliate profile may use a given promo code (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_profiles_coupon_code_lower
  ON public.affiliate_profiles (LOWER(TRIM(coupon_code)))
  WHERE coupon_code IS NOT NULL AND TRIM(coupon_code) <> '';

CREATE TABLE IF NOT EXISTS public.affiliate_onboarding_sessions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  unlock_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Users may read own session (optional UI); writes go through service role in API routes.
DROP POLICY IF EXISTS "Users read own affiliate_onboarding_sessions" ON public.affiliate_onboarding_sessions;
CREATE POLICY "Users read own affiliate_onboarding_sessions"
  ON public.affiliate_onboarding_sessions FOR SELECT
  USING (auth.uid() = user_id);

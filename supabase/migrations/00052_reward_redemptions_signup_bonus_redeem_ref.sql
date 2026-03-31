-- Reward redemptions (Woo coupon traceability), signup bonus RPC, redeem reference id.
-- Also normalizes legacy signup_bonus rows to 50 pts (one-time data fix).

-- ---------------------------------------------------------------------------
-- 1) reward_redemptions: one row per app redemption → unique Woo coupon
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redemption_option_id TEXT NOT NULL,
  redemption_reference_id TEXT NOT NULL,
  points_spent INTEGER NOT NULL,
  coupon_code TEXT NOT NULL,
  woo_coupon_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('issued', 'used', 'invalidated')),
  used_order_external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  invalidated_at TIMESTAMPTZ,
  UNIQUE (redemption_reference_id),
  UNIQUE (coupon_code)
);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON public.reward_redemptions (user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_coupon_code_upper
  ON public.reward_redemptions (upper(trim(coupon_code)));

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own reward_redemptions" ON public.reward_redemptions;
CREATE POLICY "Users can read own reward_redemptions" ON public.reward_redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2) Signup bonus: exactly 50 pts once per user (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_signup_bonus()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reward_points_ledger
    WHERE user_id = uid AND reason = 'signup_bonus'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.reward_points_ledger (
    user_id, amount_delta, reason, description, reference_type, reference_id
  )
  VALUES (
    uid,
    50,
    'signup_bonus',
    'Welcome bonus',
    'signup_bonus',
    uid::text
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_signup_bonus() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_signup_bonus() TO authenticated;

COMMENT ON FUNCTION public.claim_signup_bonus() IS
  'One-time 50 pt signup bonus; idempotent.';

-- Normalize historical signup_bonus rows to 50 points (balance correction).
UPDATE public.reward_points_ledger
SET amount_delta = 50
WHERE reason = 'signup_bonus' AND amount_delta IS DISTINCT FROM 50;

-- ---------------------------------------------------------------------------
-- 3) redeem_reward_points: optional per-redemption reference id (unique ledger rows)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_reward_points(
  p_user_id uuid,
  p_option_id text,
  p_points integer,
  p_reason text,
  p_description text DEFAULT NULL,
  p_reference_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, auth
AS $$
DECLARE
  current_balance integer;
  ref_id text;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only redeem for yourself';
  END IF;

  ref_id := NULLIF(trim(COALESCE(p_reference_id, '')), '');
  IF ref_id IS NULL THEN
    ref_id := p_option_id;
  END IF;

  PERFORM 1
  FROM public.reward_points_ledger
  WHERE user_id = p_user_id
  FOR UPDATE;

  SELECT COALESCE(SUM(amount_delta), 0) INTO current_balance
  FROM public.reward_points_ledger
  WHERE user_id = p_user_id;

  IF current_balance < p_points THEN
    RAISE EXCEPTION 'Not enough points. You have % pts; this option requires % pts.', current_balance, p_points;
  END IF;

  INSERT INTO public.reward_points_ledger (
    user_id, amount_delta, reason, description, reference_type, reference_id
  )
  VALUES (
    p_user_id,
    -p_points,
    p_reason,
    p_description,
    'redemption',
    ref_id
  );
END;
$$;

COMMENT ON FUNCTION public.redeem_reward_points(uuid, text, integer, text, text, text) IS
  'Atomic redemption: lock ledger rows, check balance, insert redemption with optional unique reference_id.';

GRANT EXECUTE ON FUNCTION public.redeem_reward_points(uuid, text, integer, text, text, text) TO authenticated;

-- Drop old 5-arg signature if present (Postgres allows overloads).
DROP FUNCTION IF EXISTS public.redeem_reward_points(uuid, text, integer, text, text);

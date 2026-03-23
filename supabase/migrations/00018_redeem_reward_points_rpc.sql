-- Atomic reward redemption: balance check + insert in one transaction with row lock.
-- Prevents double-spend when two concurrent requests try to redeem.
-- Run after 00017.

CREATE OR REPLACE FUNCTION redeem_reward_points(
  p_user_id uuid,
  p_option_id text,
  p_points integer,
  p_reason text,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, auth
AS $$
DECLARE
  current_balance integer;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only redeem for yourself';
  END IF;

  -- Lock user's ledger rows so concurrent redemptions are serialized.
  SELECT COALESCE(SUM(amount_delta), 0) INTO current_balance
  FROM reward_points_ledger
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance < p_points THEN
    RAISE EXCEPTION 'Not enough points. You have % pts; this option requires % pts.', current_balance, p_points;
  END IF;

  INSERT INTO reward_points_ledger (user_id, amount_delta, reason, description, reference_type, reference_id)
  VALUES (p_user_id, -p_points, p_reason, p_description, 'redemption', p_option_id);
END;
$$;

COMMENT ON FUNCTION redeem_reward_points(uuid, text, integer, text, text) IS
  'Atomic redemption: checks balance under row lock and inserts negative ledger entry. Prevents double-spend.';

GRANT EXECUTE ON FUNCTION redeem_reward_points(uuid, text, integer, text, text) TO authenticated;

-- Phase 5 demo seed: orders, shipments, rewards
-- Use only in development/demo. Replace the UUID below with your auth.users id.
-- Run in Supabase SQL Editor after migrations 00001, 00002, 00003.
-- To get your user id: SELECT id FROM auth.users WHERE email = 'your@email.com';

DO $$
DECLARE
  demo_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- REPLACE with your user UUID
  new_order_id UUID;
BEGIN
  -- Insert one sample order
  INSERT INTO orders (user_id, order_number, external_id, status, total_cents, currency, item_count, shop_url, created_at)
  VALUES (
    demo_user_id,
    'MS-1001',
    'ext-1001',
    'delivered',
    5999,
    'USD',
    2,
    NULL,
    NOW() - INTERVAL '5 days'
  )
  RETURNING id INTO new_order_id;

  -- Insert shipment for that order
  INSERT INTO shipments (order_id, carrier, tracking_number, status, shipped_at, estimated_delivery, delivered_at, created_at)
  VALUES (
    new_order_id,
    'USPS',
    '9400111899561234567890',
    'delivered',
    NOW() - INTERVAL '4 days',
    (NOW() - INTERVAL '3 days')::date,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '4 days'
  );

  -- Reward ledger entries
  INSERT INTO reward_points_ledger (user_id, amount_delta, reason, description, created_at)
  VALUES
    (demo_user_id, 150, 'purchase', 'Points from order', NOW() - INTERVAL '5 days'),
    (demo_user_id, 50, 'signup_bonus', 'Welcome bonus', NOW() - INTERVAL '10 days');
END $$;

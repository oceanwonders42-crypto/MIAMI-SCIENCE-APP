-- Phase 6: Affiliate display, community rooms, moderation
-- Run after 00003

-- Affiliate profiles: optional display fields
ALTER TABLE affiliate_profiles
  ADD COLUMN IF NOT EXISTS referral_link TEXT,
  ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending';

-- Moderation reports: admin review tracking
ALTER TABLE moderation_reports
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- RLS: admin can read and update all moderation_reports
CREATE OR REPLACE FUNCTION public.has_role_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Admin can read all moderation_reports" ON moderation_reports;
CREATE POLICY "Admin can read all moderation_reports" ON moderation_reports
  FOR SELECT USING (public.has_role_admin());

DROP POLICY IF EXISTS "Admin can update moderation_reports" ON moderation_reports;
CREATE POLICY "Admin can update moderation_reports" ON moderation_reports
  FOR UPDATE USING (public.has_role_admin());

-- RLS: authenticated users can join any chat room (insert own membership)
DROP POLICY IF EXISTS "Users can join chat rooms" ON chat_room_members;
CREATE POLICY "Users can join chat rooms" ON chat_room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed default chat rooms if not present
INSERT INTO chat_rooms (slug, name, is_affiliate_only)
VALUES
  ('community', 'Community', false),
  ('affiliates', 'Affiliates', true)
ON CONFLICT (slug) DO NOTHING;

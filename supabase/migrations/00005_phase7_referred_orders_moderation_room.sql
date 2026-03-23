-- Phase 7: Referred orders, moderation context
-- Run after 00004

-- Orders: track which affiliate referred (for referred-orders list)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_referred_by ON orders(referred_by_user_id);

-- Moderation: room context for "view in context" link
ALTER TABLE moderation_reports
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES chat_rooms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_moderation_reports_room_id ON moderation_reports(room_id);

-- RLS: admin can read all profiles (for affiliate list display names)
CREATE POLICY "Admin can read all profiles" ON profiles
  FOR SELECT USING (public.has_role_admin());

-- RLS: admin can manage affiliate_profiles (any user)
CREATE POLICY "Admin can read all affiliate_profiles" ON affiliate_profiles
  FOR SELECT USING (public.has_role_admin());
CREATE POLICY "Admin can insert affiliate_profiles" ON affiliate_profiles
  FOR INSERT WITH CHECK (public.has_role_admin());
CREATE POLICY "Admin can update affiliate_profiles" ON affiliate_profiles
  FOR UPDATE USING (public.has_role_admin());

-- RLS: admin can update user_roles (e.g. set affiliate)
CREATE POLICY "Admin can update user_roles" ON user_roles
  FOR UPDATE USING (public.has_role_admin());

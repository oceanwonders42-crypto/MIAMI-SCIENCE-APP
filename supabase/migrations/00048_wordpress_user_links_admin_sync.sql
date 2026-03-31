-- Durable WordPress identity link for app users.
-- Purpose:
-- 1) keep a stable external identity (wordpress_user_id) instead of relying on email forever
-- 2) allow controlled admin promotion when external source confirms wp admin/shop_manager role

CREATE TABLE IF NOT EXISTS wordpress_user_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wordpress_user_id BIGINT NOT NULL,
  wordpress_email TEXT NOT NULL,
  wordpress_role TEXT,
  is_wordpress_admin BOOLEAN NOT NULL DEFAULT false,
  match_source TEXT NOT NULL CHECK (match_source IN ('auto_email', 'woocommerce_customer', 'manual')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(wordpress_user_id)
);

CREATE INDEX IF NOT EXISTS idx_wordpress_user_links_wp_email
  ON wordpress_user_links (LOWER(TRIM(wordpress_email)));

CREATE INDEX IF NOT EXISTS idx_wordpress_user_links_is_admin
  ON wordpress_user_links (is_wordpress_admin);

ALTER TABLE wordpress_user_links ENABLE ROW LEVEL SECURITY;

-- User can view own link row.
DROP POLICY IF EXISTS "Users can read own wordpress_user_link" ON wordpress_user_links;
CREATE POLICY "Users can read own wordpress_user_link" ON wordpress_user_links
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all rows for diagnostics.
DROP POLICY IF EXISTS "Admins can read wordpress_user_links" ON wordpress_user_links;
CREATE POLICY "Admins can read wordpress_user_links" ON wordpress_user_links
  FOR SELECT USING (public.has_role_admin());

-- Writes are service-role only (no INSERT/UPDATE policy).

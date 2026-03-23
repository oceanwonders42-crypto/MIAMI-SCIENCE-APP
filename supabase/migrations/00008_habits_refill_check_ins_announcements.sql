-- Phase: Habits & Refill — check-ins and announcements
-- Run after 00007

-- Daily check-ins: one row per user per calendar day
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  routine_done BOOLEAN NOT NULL DEFAULT false,
  worked_out BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

CREATE INDEX idx_check_ins_user_date ON check_ins(user_id, check_in_date DESC);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own check_ins" ON check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own check_ins" ON check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own check_ins" ON check_ins FOR UPDATE USING (auth.uid() = user_id);

-- Announcements: admin-managed; customers read only
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_published ON announcements(published_at DESC) WHERE published_at IS NOT NULL;

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read published announcements; admins can read all (for future management UI)
CREATE POLICY "Authenticated can read published announcements" ON announcements FOR SELECT TO authenticated
  USING (published_at IS NOT NULL AND published_at <= now());
CREATE POLICY "Admins can read all announcements" ON announcements FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Admins can manage announcements (via role check)
CREATE POLICY "Admins can insert announcements" ON announcements FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update announcements" ON announcements FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete announcements" ON announcements FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

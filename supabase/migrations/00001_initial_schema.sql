-- Miami Science Tracker — Initial schema
-- Run this in Supabase SQL editor or via supabase db push

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom role type
CREATE TYPE app_role AS ENUM ('customer', 'affiliate', 'admin');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- User roles (one row per user, one role)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Workouts
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workout entries (exercises within a workout)
CREATE TABLE workout_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INT,
  reps INT,
  weight DECIMAL(10,2),
  notes TEXT
);

-- Body metrics
CREATE TABLE body_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL,
  weight_kg DECIMAL(6,2),
  measurements JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Protocols (user-defined routines)
CREATE TABLE protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Protocol adherence logs
CREATE TYPE adherence_type AS ENUM ('completed', 'partial', 'skipped');
CREATE TABLE protocol_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  logged_at DATE NOT NULL,
  adherence adherence_type NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products (reference for shop links)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  shop_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product links (shop/reorder URLs)
CREATE TABLE product_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Supplies (user supply tracker)
CREATE TABLE supplies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_count INT NOT NULL DEFAULT 0,
  threshold_alert INT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders (synced from ecommerce later)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT,
  status TEXT NOT NULL,
  total_cents INT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shipments
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier TEXT,
  tracking_number TEXT,
  status TEXT NOT NULL,
  estimated_delivery DATE,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reward points ledger
CREATE TABLE reward_points_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_delta INT NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Affiliate profiles
CREATE TYPE affiliate_status AS ENUM ('active', 'paused', 'suspended');
CREATE TABLE affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  coupon_code TEXT,
  status affiliate_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Affiliate stats cache (for dashboard; sync from SliceWP later)
CREATE TABLE affiliate_stats_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  clicks INT NOT NULL DEFAULT 0,
  conversions INT NOT NULL DEFAULT 0,
  commission_cents INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period)
);

-- Chat rooms
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_affiliate_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat room members
CREATE TABLE chat_room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Moderation reports
CREATE TABLE moderation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workout_entries_workout_id ON workout_entries(workout_id);
CREATE INDEX idx_body_metrics_user_id ON body_metrics(user_id);
CREATE INDEX idx_protocols_user_id ON protocols(user_id);
CREATE INDEX idx_protocol_logs_protocol_id ON protocol_logs(protocol_id);
CREATE INDEX idx_supplies_user_id ON supplies(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_reward_points_ledger_user_id ON reward_points_ledger(user_id);
CREATE INDEX idx_affiliate_profiles_user_id ON affiliate_profiles(user_id);
CREATE INDEX idx_affiliate_stats_cache_user_id ON affiliate_stats_cache(user_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_room_members_room_id ON chat_room_members(room_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_moderation_reports_message_id ON moderation_reports(message_id);

-- RLS: enable on all tables (policies to be added per-table)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_stats_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (user sees own data; admin policies can be added via service role or custom claims)
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);
-- Insert/update user_roles restricted to service role or admin (add later)

CREATE POLICY "Users can CRUD own workouts" ON workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD workout_entries for own workouts" ON workout_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_entries.workout_id AND w.user_id = auth.uid()));
CREATE POLICY "Users can CRUD own body_metrics" ON body_metrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own protocols" ON protocols FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD protocol_logs for own protocols" ON protocol_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM protocols p WHERE p.id = protocol_logs.protocol_id AND p.user_id = auth.uid()));

CREATE POLICY "Products are readable by all authenticated" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Product links are readable by all authenticated" ON product_links FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can CRUD own supplies" ON supplies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read shipments for own orders" ON shipments FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = shipments.order_id AND o.user_id = auth.uid()));
CREATE POLICY "Users can read own reward_points_ledger" ON reward_points_ledger FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own affiliate_profile" ON affiliate_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own affiliate_stats_cache" ON affiliate_stats_cache FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Chat rooms readable by authenticated" ON chat_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Chat room members can read own memberships" ON chat_room_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Chat messages readable by room members" ON chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM chat_room_members crm WHERE crm.room_id = chat_messages.room_id AND crm.user_id = auth.uid()));
CREATE POLICY "Chat messages insert by room members" ON chat_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM chat_room_members crm WHERE crm.room_id = chat_messages.room_id AND crm.user_id = auth.uid()));

CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications (read_at)" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create moderation_reports" ON moderation_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can read own reports" ON moderation_reports FOR SELECT USING (auth.uid() = reporter_id);

-- Trigger: create profile and assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

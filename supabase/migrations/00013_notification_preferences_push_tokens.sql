-- Notification preferences and push token placeholder.
-- Run after 00012.

-- Notification preferences: one row per user; defaults apply when missing.
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reorder_reminders BOOLEAN NOT NULL DEFAULT true,
  comeback_reminders BOOLEAN NOT NULL DEFAULT true,
  weekly_recap BOOLEAN NOT NULL DEFAULT true,
  announcements BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notification_preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification_preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification_preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Push tokens: placeholder for future Expo / OneSignal integration.
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own push_tokens" ON push_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own push_tokens" ON push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own push_tokens" ON push_tokens FOR DELETE USING (auth.uid() = user_id);

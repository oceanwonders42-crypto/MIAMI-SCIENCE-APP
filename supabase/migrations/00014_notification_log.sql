-- Notification log for auditability and throttling.
-- Run after 00013.

CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX idx_notification_log_created_at ON notification_log(created_at DESC);
CREATE INDEX idx_notification_log_user_type_sent ON notification_log(user_id, notification_type, sent_at DESC) WHERE sent_at IS NOT NULL;

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read (for admin log view). Inserts come from service role only (no INSERT policy).
CREATE POLICY "Admins can read notification_log" ON notification_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

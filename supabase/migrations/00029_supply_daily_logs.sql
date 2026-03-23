-- Per-supplement daily "taken" checklist (one row per user/supply/calendar day in user's flow).
-- log_date is YYYY-MM-DD in the user's profile timezone, computed in app code.

CREATE TABLE supply_daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supply_id UUID NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  taken BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, supply_id, log_date)
);

CREATE INDEX idx_supply_daily_logs_user_date ON supply_daily_logs(user_id, log_date DESC);
CREATE INDEX idx_supply_daily_logs_supply ON supply_daily_logs(supply_id);

ALTER TABLE supply_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own supply_daily_logs" ON supply_daily_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own supply_daily_logs" ON supply_daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own supply_daily_logs" ON supply_daily_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own supply_daily_logs" ON supply_daily_logs
  FOR DELETE USING (auth.uid() = user_id);

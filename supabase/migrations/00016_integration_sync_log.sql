-- Integration sync log for diagnostics (last run summary only; no secrets).
-- Run after 00015.

CREATE TABLE integration_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration TEXT NOT NULL,
  last_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_integration_sync_log_integration ON integration_sync_log(integration);
CREATE INDEX idx_integration_sync_log_last_run_at ON integration_sync_log(last_run_at DESC);

ALTER TABLE integration_sync_log ENABLE ROW LEVEL SECURITY;

-- Admins can read for diagnostics. Writes use service role (bypasses RLS).
CREATE POLICY "Admins can read integration_sync_log" ON integration_sync_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

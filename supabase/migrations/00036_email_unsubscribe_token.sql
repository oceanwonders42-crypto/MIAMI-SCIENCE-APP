-- One-click email unsubscribe tokens (public link, no login).
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_unsubscribe_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_email_unsubscribe_token
  ON notification_preferences(email_unsubscribe_token)
  WHERE email_unsubscribe_token IS NOT NULL;

-- Backfill stable tokens for existing rows (idempotent: only where null).
UPDATE notification_preferences
SET email_unsubscribe_token = encode(gen_random_bytes(32), 'hex')
WHERE email_unsubscribe_token IS NULL;

-- push_tokens: updated_at, NOT NULL platform, one row per user per platform (upsert on token refresh).
-- Adds UPDATE policy for client upserts.

ALTER TABLE push_tokens
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE push_tokens SET updated_at = created_at WHERE updated_at IS NULL;

UPDATE push_tokens SET platform = COALESCE(NULLIF(trim(platform), ''), 'web') WHERE platform IS NULL OR trim(platform) = '';

ALTER TABLE push_tokens ALTER COLUMN platform SET NOT NULL;
ALTER TABLE push_tokens ALTER COLUMN platform SET DEFAULT 'web';

-- Replace (user_id, token) unique with (user_id, platform) for token refresh upserts.
ALTER TABLE push_tokens DROP CONSTRAINT IF EXISTS push_tokens_user_id_token_key;

-- Keep the newest row per (user_id, platform) before adding the new unique constraint.
DELETE FROM push_tokens
WHERE ctid NOT IN (
  SELECT DISTINCT ON (user_id, platform) ctid
  FROM push_tokens
  ORDER BY user_id, platform, created_at DESC NULLS LAST, id DESC
);

ALTER TABLE push_tokens
  ADD CONSTRAINT push_tokens_user_id_platform_key UNIQUE (user_id, platform);

CREATE POLICY "Users can update own push_tokens" ON push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON COLUMN push_tokens.updated_at IS 'Last registration or token refresh';

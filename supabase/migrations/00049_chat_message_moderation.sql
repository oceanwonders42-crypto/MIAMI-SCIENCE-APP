-- Admin chat moderation metadata (soft-delete + hide/unhide with audit fields).

ALTER TABLE IF EXISTS chat_messages
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_reason TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_note TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_messages_is_hidden
  ON chat_messages (is_hidden);

CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted_at
  ON chat_messages (deleted_at);

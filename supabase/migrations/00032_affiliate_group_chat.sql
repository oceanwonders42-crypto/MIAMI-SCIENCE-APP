-- Section 5: Affiliate team chat — pins, admin flag, read receipts, RLS, realtime

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_admin_message BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_pinned ON chat_messages(room_id) WHERE is_pinned = true;

CREATE TABLE IF NOT EXISTS chat_read_receipts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_read_receipts_room ON chat_read_receipts(room_id);

ALTER TABLE chat_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own chat receipts" ON chat_read_receipts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users upsert own chat receipts" ON chat_read_receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own chat receipts" ON chat_read_receipts
  FOR UPDATE USING (auth.uid() = user_id);

-- Mark admin-authored rows for UI (team on the left)
CREATE OR REPLACE FUNCTION public.set_chat_message_admin_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.user_id AND role = 'admin') THEN
    NEW.is_admin_message := true;
  ELSE
    NEW.is_admin_message := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_messages_admin_flag ON chat_messages;
CREATE TRIGGER trg_chat_messages_admin_flag
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_chat_message_admin_flag();

-- Replace chat_messages policies for affiliate room access without requiring membership
DROP POLICY IF EXISTS "Chat messages readable by room members" ON chat_messages;
DROP POLICY IF EXISTS "Chat messages insert by room members" ON chat_messages;

CREATE POLICY "Chat messages readable by members or affiliate room"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_members crm
      WHERE crm.room_id = chat_messages.room_id AND crm.user_id = auth.uid()
    )
    OR (
      EXISTS (
        SELECT 1 FROM chat_rooms r
        WHERE r.id = chat_messages.room_id AND r.slug = 'affiliates'
      )
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('affiliate', 'admin')
      )
    )
  );

CREATE POLICY "Chat messages insert by members or affiliate room"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM chat_room_members crm
        WHERE crm.room_id = chat_messages.room_id AND crm.user_id = auth.uid()
      )
      OR (
        EXISTS (
          SELECT 1 FROM chat_rooms r
          WHERE r.id = chat_messages.room_id AND r.slug = 'affiliates'
        )
        AND EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role IN ('affiliate', 'admin')
        )
      )
    )
  );

-- Admin-only pin toggle for affiliate room (single pinned message)
CREATE OR REPLACE FUNCTION public.pin_affiliate_chat_message(p_message_id uuid, p_pinned boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room uuid;
  v_slug text;
BEGIN
  IF NOT public.has_role_admin() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  SELECT room_id INTO v_room FROM chat_messages WHERE id = p_message_id;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'not found';
  END IF;
  SELECT slug INTO v_slug FROM chat_rooms WHERE id = v_room;
  IF v_slug IS DISTINCT FROM 'affiliates' THEN
    RAISE EXCEPTION 'invalid room';
  END IF;
  IF COALESCE(p_pinned, false) THEN
    UPDATE chat_messages SET is_pinned = false WHERE room_id = v_room;
  END IF;
  UPDATE chat_messages SET is_pinned = COALESCE(p_pinned, false) WHERE id = p_message_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pin_affiliate_chat_message(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pin_affiliate_chat_message(uuid, boolean) TO authenticated;

-- Realtime (idempotent)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Display name for affiliate room
UPDATE chat_rooms SET name = 'Affiliate team chat' WHERE slug = 'affiliates' AND name = 'Affiliates';

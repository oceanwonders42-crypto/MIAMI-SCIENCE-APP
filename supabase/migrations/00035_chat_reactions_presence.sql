-- Reactions on chat messages + room presence for "online" indicators.

-- ---------------------------------------------------------------------------
-- chat_reactions: one row per user per emoji per message (toggle removes row)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chat_reactions_unique_user_emoji UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON public.chat_reactions(message_id);

ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read chat_reactions" ON public.chat_reactions;
CREATE POLICY "Authenticated users can read chat_reactions"
  ON public.chat_reactions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users insert own chat_reactions" ON public.chat_reactions;
CREATE POLICY "Users insert own chat_reactions"
  ON public.chat_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own chat_reactions" ON public.chat_reactions;
CREATE POLICY "Users delete own chat_reactions"
  ON public.chat_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Realtime for live reaction counts
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- chat_room_presence: heartbeat per user per room (last_seen within 5 min = "online")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_room_presence (
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_room_presence_room_seen ON public.chat_room_presence(room_id, last_seen_at DESC);

ALTER TABLE public.chat_room_presence ENABLE ROW LEVEL SECURITY;

-- Same visibility pattern as chat_messages (members OR affiliates room + role)
DROP POLICY IF EXISTS "Read presence for accessible rooms" ON public.chat_room_presence;
CREATE POLICY "Read presence for accessible rooms"
  ON public.chat_room_presence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      WHERE crm.room_id = chat_room_presence.room_id AND crm.user_id = auth.uid()
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.chat_rooms r
        WHERE r.id = chat_room_presence.room_id AND r.slug = 'affiliates'
      )
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('affiliate', 'admin')
      )
    )
  );

DROP POLICY IF EXISTS "Upsert own presence in accessible rooms" ON public.chat_room_presence;
CREATE POLICY "Upsert own presence in accessible rooms"
  ON public.chat_room_presence
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.chat_room_members crm
        WHERE crm.room_id = chat_room_presence.room_id AND crm.user_id = auth.uid()
      )
      OR (
        EXISTS (
          SELECT 1 FROM public.chat_rooms r
          WHERE r.id = chat_room_presence.room_id AND r.slug = 'affiliates'
        )
        AND EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role IN ('affiliate', 'admin')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Update own presence in accessible rooms" ON public.chat_room_presence;
CREATE POLICY "Update own presence in accessible rooms"
  ON public.chat_room_presence
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Live updates for presence dots
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_room_presence;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

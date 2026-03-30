-- Upsert on chat_room_members conflicts runs UPDATE; without a policy, RLS blocks the second join attempt.
-- App code uses ignoreDuplicates:true to use ON CONFLICT DO NOTHING; this policy covers any other upsert/update paths.
DROP POLICY IF EXISTS "Users can update own chat room membership" ON public.chat_room_members;
CREATE POLICY "Users can update own chat room membership" ON public.chat_room_members
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

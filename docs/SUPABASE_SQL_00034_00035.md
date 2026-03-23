# Manual SQL (Supabase SQL Editor)

If you apply migrations manually instead of `supabase db push`, run in order:

1. **Affiliate payout fields (Section 7)** — contents of  
   `supabase/migrations/00034_affiliate_payout_fields.sql`

2. **Community chat reactions + presence (Section 8)** — contents of  
   `supabase/migrations/00035_chat_reactions_presence.sql`

After `00035`, enable **Realtime** for new tables in the Supabase Dashboard if needed:

- **Database → Replication** — ensure `chat_reactions` and `chat_room_presence` are part of the `supabase_realtime` publication (the migration attempts `ALTER PUBLICATION` for both).

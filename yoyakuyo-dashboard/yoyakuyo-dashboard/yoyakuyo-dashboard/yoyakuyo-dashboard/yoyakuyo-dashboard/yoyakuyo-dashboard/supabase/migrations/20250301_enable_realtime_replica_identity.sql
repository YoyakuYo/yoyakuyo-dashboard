-- ============================================
-- ENABLE REPLICA IDENTITY FOR REALTIME
-- ============================================
-- This migration sets REPLICA IDENTITY FULL on tables that need realtime
-- Supabase Realtime REQUIRES REPLICA IDENTITY FULL to send full row data in events
-- Without this, realtime events won't fire or will be incomplete
-- ============================================

-- Enable REPLICA IDENTITY FULL for messages table
-- This allows Supabase Realtime to send complete row data in INSERT/UPDATE events
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Enable REPLICA IDENTITY FULL for conversations table
-- This allows Supabase Realtime to send complete row data in INSERT/UPDATE events
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- Verify the tables are in the realtime publication (should already be done, but ensure it)
-- These commands are idempotent - safe to run multiple times
DO $$
BEGIN
    -- Add messages to realtime publication if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
        RAISE NOTICE 'Added messages table to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'messages table already in supabase_realtime publication';
    END IF;

    -- Add conversations to realtime publication if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
        RAISE NOTICE 'Added conversations table to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'conversations table already in supabase_realtime publication';
    END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES (for debugging)
-- ============================================
-- Run these in Supabase SQL Editor to verify:
-- 
-- SELECT 
--     schemaname, 
--     tablename, 
--     relreplident 
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' 
-- AND c.relname IN ('messages', 'conversations');
--
-- Should show 'f' (FULL) for relreplident
--
-- SELECT 
--     pubname, 
--     tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime' 
-- AND tablename IN ('messages', 'conversations');
--
-- Should show both tables in the publication
-- ============================================

COMMENT ON TABLE messages IS 'Messages table with REPLICA IDENTITY FULL enabled for Supabase Realtime';
COMMENT ON TABLE conversations IS 'Conversations table with REPLICA IDENTITY FULL enabled for Supabase Realtime';


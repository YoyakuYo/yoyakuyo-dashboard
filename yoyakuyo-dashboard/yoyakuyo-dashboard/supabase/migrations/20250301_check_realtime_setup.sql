-- ============================================
-- DIAGNOSTIC: CHECK REALTIME SETUP
-- ============================================
-- Run this in Supabase SQL Editor to verify realtime is properly configured
-- ============================================

-- 1. Check REPLICA IDENTITY (should be 'f' for FULL)
SELECT 
    n.nspname as schemaname,
    c.relname as tablename, 
    CASE c.relreplident
        WHEN 'f' THEN 'FULL ✅'
        WHEN 'd' THEN 'DEFAULT ❌ (NEEDS FIX)'
        WHEN 'n' THEN 'NOTHING ❌ (NEEDS FIX)'
        WHEN 'i' THEN 'INDEX ❌ (NEEDS FIX)'
        ELSE 'UNKNOWN'
    END as replica_identity,
    c.relreplident
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
AND c.relname IN ('messages', 'conversations')
ORDER BY c.relname;

-- 2. Check if tables are in realtime publication
SELECT 
    pubname, 
    tablename,
    CASE 
        WHEN tablename IN ('messages', 'conversations') THEN '✅ IN PUBLICATION'
        ELSE '❌ NOT IN PUBLICATION'
    END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('messages', 'conversations')
ORDER BY tablename;

-- 3. If tables are missing from publication, add them:
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- 4. If REPLICA IDENTITY is not FULL, fix it:
-- ALTER TABLE messages REPLICA IDENTITY FULL;
-- ALTER TABLE conversations REPLICA IDENTITY FULL;


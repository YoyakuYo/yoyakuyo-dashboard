-- ============================================
-- QUICK CHECK: REPLICA IDENTITY STATUS
-- ============================================
-- Run this to see if REPLICA IDENTITY is set to FULL
-- ============================================

SELECT 
    c.relname as table_name,
    CASE c.relreplident
        WHEN 'f' THEN 'FULL ✅ (CORRECT)'
        WHEN 'd' THEN 'DEFAULT ❌ (NEEDS FIX)'
        WHEN 'n' THEN 'NOTHING ❌ (NEEDS FIX)'
        WHEN 'i' THEN 'INDEX ❌ (NEEDS FIX)'
        ELSE 'UNKNOWN'
    END as replica_identity_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
AND c.relname IN ('messages', 'conversations')
ORDER BY c.relname;

-- ============================================
-- IF STATUS SHOWS ❌, RUN THIS TO FIX:
-- ============================================

-- ALTER TABLE messages REPLICA IDENTITY FULL;
-- ALTER TABLE conversations REPLICA IDENTITY FULL;


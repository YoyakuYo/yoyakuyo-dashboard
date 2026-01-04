-- Complete verification for real-time notifications setup
-- Run all these queries to verify everything is configured correctly

-- ✅ 1. RLS Policies (Already verified - looks good!)
-- Your policies correctly include admin support

-- 2. Check if notifications is in supabase_realtime publication
SELECT 
    tablename,
    CASE 
        WHEN tablename = 'notifications' THEN '✅ IN PUBLICATION'
        ELSE '❌ NOT IN PUBLICATION'
    END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'notifications';

-- Expected: notifications | ✅ IN PUBLICATION

-- 3. Check REPLICA IDENTITY is FULL (required for realtime)
SELECT 
    relname as table_name,
    CASE relreplident
        WHEN 'f' THEN 'FULL ✅'
        WHEN 'd' THEN 'DEFAULT ❌'
        ELSE 'OTHER'
    END as replica_identity
FROM pg_class
WHERE relname = 'notifications';

-- Expected: notifications | FULL ✅

-- 4. Check constraint allows 'admin' recipient_type
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
AND conname LIKE '%recipient_type%';

-- Expected: Should show CHECK (recipient_type IN ('owner', 'customer', 'admin'))

-- 5. Summary check - all in one
SELECT 
    'RLS Policies' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'notifications' 
            AND policyname = 'Users can read own notifications'
            AND qual::text LIKE '%admin%'
        ) THEN '✅ Admin policies exist'
        ELSE '❌ Admin policies missing'
    END as status
UNION ALL
SELECT 
    'Realtime Publication' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'notifications'
        ) THEN '✅ In publication'
        ELSE '❌ Not in publication'
    END as status
UNION ALL
SELECT 
    'REPLICA IDENTITY' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = 'notifications' 
            AND relreplident = 'f'
        ) THEN '✅ FULL enabled'
        ELSE '❌ Not FULL'
    END as status
UNION ALL
SELECT 
    'Admin Constraint' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'notifications'::regclass
            AND pg_get_constraintdef(oid) LIKE '%admin%'
        ) THEN '✅ Admin allowed'
        ELSE '❌ Admin not allowed'
    END as status;


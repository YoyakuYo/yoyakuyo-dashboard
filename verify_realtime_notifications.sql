-- Verification queries for real-time notifications setup
-- Run these in Supabase SQL Editor to verify everything is configured correctly

-- 1. Check if notifications table supports 'admin' recipient_type
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
AND conname LIKE '%recipient_type%';

-- Should show: CHECK (recipient_type IN ('owner', 'customer', 'admin'))

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

-- Should return: notifications | ✅ IN PUBLICATION

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

-- Should return: notifications | FULL ✅

-- 4. Check RLS policies for admin access
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'notifications'
AND policyname LIKE '%Users can%';

-- Should show policies that allow admin access

-- 5. Test: Create a sample admin notification (optional - for testing)
-- Uncomment to test:
/*
INSERT INTO notifications (
    recipient_type,
    recipient_id,
    type,
    title,
    body,
    data,
    is_read
) VALUES (
    'admin',
    'YOUR_ADMIN_USER_ID_HERE', -- Replace with actual admin user ID
    'test_notification',
    'Test Notification',
    'This is a test notification to verify realtime is working',
    '{}',
    false
);
*/


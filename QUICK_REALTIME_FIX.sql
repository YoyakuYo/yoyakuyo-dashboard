-- Quick SQL to add notifications table to Realtime publication
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Add notifications to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Step 2: Enable REPLICA IDENTITY FULL (required for realtime to work)
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Step 3: Verify it was added (should return 'notifications')
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'notifications';

-- Step 4: Verify REPLICA IDENTITY is FULL (should return 'FULL ✅')
SELECT 
    relname as table_name,
    CASE relreplident
        WHEN 'f' THEN 'FULL ✅'
        WHEN 'd' THEN 'DEFAULT ❌'
        ELSE 'OTHER'
    END as replica_identity
FROM pg_class
WHERE relname = 'notifications';


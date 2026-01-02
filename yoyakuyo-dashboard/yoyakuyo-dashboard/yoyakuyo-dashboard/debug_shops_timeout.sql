-- Debug shops query timeout
-- Check if the shops query is working and why it might be timing out

-- 1. Check if the shops table has data
SELECT COUNT(*) as total_shops FROM shops;

-- 2. Check if owner_user_id index exists
SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'shops'
    AND indexname LIKE '%owner%';

-- 3. Check RLS policies on shops table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'shops';

-- 4. Test a simple shops query
SELECT id, owner_user_id, name
FROM shops
WHERE owner_user_id IS NOT NULL
LIMIT 5;

-- 5. Check if there are any shops with the specific user ID (replace with actual user ID from logs)
-- You'll need to replace 'USER_ID_HERE' with the actual user ID from your analytics logs
-- SELECT id, name FROM shops WHERE owner_user_id = 'USER_ID_HERE';

-- 6. Check query execution plan (explain)
-- EXPLAIN ANALYZE SELECT id FROM shops WHERE owner_user_id = 'USER_ID_HERE' LIMIT 1;

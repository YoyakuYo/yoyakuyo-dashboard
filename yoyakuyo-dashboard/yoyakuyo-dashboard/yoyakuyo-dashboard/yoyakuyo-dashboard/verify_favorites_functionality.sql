-- ============================================
-- VERIFICATION QUERIES FOR FAVORITES FUNCTIONALITY
-- ============================================

-- 1. Check if customer_favorites table exists and has correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_favorites'
ORDER BY ordinal_position;

-- 2. Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'customer_favorites'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Check RLS policies on customer_favorites
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'customer_favorites';

-- 4. Check customer_profiles structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_profiles'
ORDER BY ordinal_position;

-- 5. Verify relationship: Check if customer_profiles.id matches auth.uid() for web customers
-- This query shows customer profiles and their auth relationship
SELECT 
    cp.id AS customer_profile_id,
    cp.customer_auth_id,
    cp.name,
    cp.email,
    CASE 
        WHEN cp.id = cp.customer_auth_id THEN 'ID matches auth_id (old structure)'
        WHEN cp.customer_auth_id IS NOT NULL THEN 'Has separate auth_id (new structure)'
        ELSE 'No auth_id link'
    END AS relationship_type
FROM customer_profiles cp
LIMIT 10;

-- 6. Check existing favorites and their customer relationships
SELECT 
    cf.id AS favorite_id,
    cf.customer_id,
    cf.shop_id,
    cp.id AS profile_id,
    cp.customer_auth_id,
    s.name AS shop_name,
    CASE 
        WHEN cf.customer_id = cp.id THEN '✅ Correct: customer_id matches profile.id'
        WHEN cf.customer_id = cp.customer_auth_id THEN '⚠️ Wrong: customer_id matches auth_id (should be profile.id)'
        ELSE '❌ No matching profile found'
    END AS relationship_status
FROM customer_favorites cf
LEFT JOIN customer_profiles cp ON cf.customer_id = cp.id OR cf.customer_id = cp.customer_auth_id
LEFT JOIN shops s ON cf.shop_id = s.id
LIMIT 20;

-- 7. Count favorites by customer (to verify data exists)
SELECT 
    COUNT(*) AS total_favorites,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(DISTINCT shop_id) AS unique_shops
FROM customer_favorites;

-- 8. Check if RLS policy will work correctly
-- This shows what auth.uid() would need to match
SELECT 
    'RLS Policy Check' AS check_type,
    'customer_favorites RLS checks: auth.uid() = customer_id' AS policy_rule,
    'But customer_id references customer_profiles.id' AS current_structure,
    'So auth.uid() must equal customer_profiles.id for RLS to work' AS requirement,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM customer_profiles 
            WHERE id = customer_auth_id
        ) THEN '✅ Some profiles have id = auth_id (RLS will work)'
        ELSE '❌ Profiles have separate id and auth_id (RLS may fail)'
    END AS rls_compatibility
FROM customer_profiles
LIMIT 1;

-- 9. Test query: Find favorites for a specific user (replace 'USER_ID_HERE' with actual user.id)
-- This simulates what the frontend should do
/*
SELECT 
    cf.*,
    s.name AS shop_name,
    s.address AS shop_address
FROM customer_favorites cf
JOIN customer_profiles cp ON cf.customer_id = cp.id
JOIN shops s ON cf.shop_id = s.id
WHERE cp.customer_auth_id = 'USER_ID_HERE'  -- Replace with actual user.id
   OR cp.id = 'USER_ID_HERE'  -- Fallback for old structure
ORDER BY cf.created_at DESC;
*/

-- 10. Check for orphaned favorites (favorites without valid customer_profile)
SELECT 
    cf.id,
    cf.customer_id,
    cf.shop_id,
    'Orphaned: No matching customer_profile' AS issue
FROM customer_favorites cf
LEFT JOIN customer_profiles cp ON cf.customer_id = cp.id
WHERE cp.id IS NULL
LIMIT 10;


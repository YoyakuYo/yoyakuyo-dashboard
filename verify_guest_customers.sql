-- Verify guest customers in Supabase
-- Check that guest customers comply with the database constraints

SELECT 
    'GUEST CUSTOMERS VERIFICATION' as check_type,
    id,
    role,
    email,
    name,
    auth_user_id,
    line_user_id,
    created_at,
    CASE 
        WHEN role = 'guest' AND email IS NULL THEN '❌ MISSING EMAIL'
        WHEN role = 'guest' AND auth_user_id IS NOT NULL THEN '❌ HAS auth_user_id (should be NULL)'
        WHEN role = 'guest' AND line_user_id IS NOT NULL THEN '❌ HAS line_user_id (should be NULL)'
        WHEN role = 'guest' AND email IS NOT NULL AND auth_user_id IS NULL AND line_user_id IS NULL THEN '✅ VALID GUEST'
        ELSE '⚠️ UNKNOWN STATE'
    END as status
FROM customers
WHERE role = 'guest'
ORDER BY created_at DESC;

-- Count guest customers by status
SELECT 
    'GUEST CUSTOMERS SUMMARY' as check_type,
    COUNT(*) as total_guests,
    COUNT(CASE WHEN email IS NOT NULL AND auth_user_id IS NULL AND line_user_id IS NULL THEN 1 END) as valid_guests,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as missing_email,
    COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as has_auth_user_id,
    COUNT(CASE WHEN line_user_id IS NOT NULL THEN 1 END) as has_line_user_id
FROM customers
WHERE role = 'guest';


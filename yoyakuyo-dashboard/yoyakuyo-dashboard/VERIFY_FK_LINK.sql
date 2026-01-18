-- Verify if owner_auth_id points to valid auth.users.id
-- Run this to check FK status

SELECT 
    u.id,
    u.email AS public_email,
    u.owner_auth_id,
    a.id AS auth_id,
    a.email AS auth_email,
    CASE 
        WHEN u.owner_auth_id IS NULL THEN '⚠️ NULL owner_auth_id (expected for customers)'
        WHEN a.id IS NULL THEN '❌ FK BROKEN - auth user missing'
        WHEN u.email != a.email THEN '⚠️ EMAIL MISMATCH'
        WHEN u.owner_auth_id = u.id THEN '⚠️ SELF-REFERENCE (may be incorrect)'
        ELSE '✅ LINKED'
    END AS status
FROM public.users u
LEFT JOIN auth.users a ON u.owner_auth_id = a.id
WHERE u.owner_auth_id IS NOT NULL
ORDER BY u.created_at DESC;


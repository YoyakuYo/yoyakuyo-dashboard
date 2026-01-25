-- Investigate why web customers exist and if they're valid
-- Check web customers and their accounts

-- Check all web customers and their auth status
SELECT
  c.id,
  c.name,
  c.email,
  c.role,
  c.auth_user_id,
  c.created_at,
  CASE
    WHEN c.auth_user_id IS NOT NULL THEN 'Has auth account'
    ELSE 'Missing auth account (invalid web customer)'
  END as validity_status,
  u.email as auth_email,
  u.created_at as auth_created_at
FROM customers c
LEFT JOIN auth.users u ON u.id = c.auth_user_id::uuid
WHERE c.role = 'web'
ORDER BY c.created_at DESC
LIMIT 10;

-- Check if web customers have valid auth.users entries
SELECT
  'Web customer analysis:' as analysis,
  COUNT(*) as total_web_customers,
  COUNT(c.auth_user_id) as with_auth_user_id,
  COUNT(u.id) as with_valid_auth_account,
  COUNT(*) - COUNT(u.id) as invalid_web_customers
FROM customers c
LEFT JOIN auth.users u ON u.id = c.auth_user_id::uuid
WHERE c.role = 'web';

-- Check recent web customer registrations
SELECT
  c.id,
  c.name,
  c.email,
  c.created_at as customer_created,
  u.created_at as auth_created,
  u.email_confirmed_at,
  CASE
    WHEN u.email_confirmed_at IS NOT NULL THEN 'Email confirmed'
    ELSE 'Email not confirmed'
  END as confirmation_status
FROM customers c
JOIN auth.users u ON u.id = c.auth_user_id::uuid
WHERE c.role = 'web'
ORDER BY c.created_at DESC
LIMIT 5;

-- Check if there are orphaned web customers (no auth account)
SELECT
  c.id,
  c.name,
  c.email,
  c.auth_user_id,
  c.created_at,
  'Orphaned web customer - should be guest or cleaned up' as issue
FROM customers c
WHERE c.role = 'web'
  AND (c.auth_user_id IS NULL OR c.auth_user_id = '')
ORDER BY c.created_at DESC;
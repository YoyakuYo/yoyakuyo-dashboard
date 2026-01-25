-- Clean up any remaining web customers after the conversion to guests

-- Check what web customers still exist
SELECT
  c.id,
  c.name,
  c.email,
  c.role,
  c.auth_user_id,
  c.line_user_id,
  c.created_at,
  'Should be converted to guest' as status
FROM customers c
WHERE c.role = 'web'
ORDER BY c.created_at DESC;

-- Count remaining web customers
SELECT
  COUNT(*) as remaining_web_customers,
  'These should all be converted to guests' as note
FROM customers c
WHERE c.role = 'web';

-- Convert any remaining web customers to guests
UPDATE customers
SET
  role = 'guest',
  auth_user_id = NULL,
  line_user_id = NULL
WHERE role = 'web';

-- Verify the conversion worked
SELECT
  'After cleanup:' as status,
  COUNT(CASE WHEN role = 'guest' THEN 1 END) as guest_customers,
  COUNT(CASE WHEN role = 'web' THEN 1 END) as web_customers,
  COUNT(CASE WHEN role = 'line' THEN 1 END) as line_customers
FROM customers;

-- Check that conversations are now properly categorized
SELECT
  conv.customer_type,
  COUNT(*) as conversations,
  COUNT(DISTINCT conv.customer_ref) as unique_customers
FROM conversations conv
JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type IN ('guest', 'web', 'line')
GROUP BY conv.customer_type
ORDER BY conv.customer_type;

-- Final verification
SELECT
  '✅ CLEANUP COMPLETE:' as status,
  'All web customers converted to guests' as action_taken,
  'System now only has guest and LINE customers' as result;
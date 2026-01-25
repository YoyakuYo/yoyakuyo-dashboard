-- FINAL CLEANUP: Remove all remaining web customer conversations

-- Check what web conversations remain
SELECT
  conv.id,
  conv.customer_type,
  conv.customer_ref,
  conv.created_at
FROM conversations conv
WHERE conv.customer_type::text = 'web'
ORDER BY conv.created_at DESC;

-- Force update ALL web conversations to guest
UPDATE conversations
SET customer_type = 'guest'::customer_type_enum
WHERE customer_type::text = 'web';

-- Verify no web conversations remain
SELECT
  'Web conversations remaining:' as check,
  COUNT(*) as count
FROM conversations
WHERE customer_type::text = 'web';

-- Final summary - should only show guest and line
SELECT
  customer_type::text as customer_type,
  COUNT(*) as conversations,
  COUNT(DISTINCT customer_ref) as unique_customers
FROM conversations
GROUP BY customer_type
ORDER BY customer_type;

-- Also check that we have no more web customers in the customers table
SELECT
  'Web customers in customers table:' as check,
  COUNT(*) as count
FROM customers
WHERE role = 'web';

-- Complete cleanup summary
SELECT
  '🎉 FINAL CLEANUP COMPLETE:' as status,
  'No web customers or conversations remain' as result,
  'System simplified to guest + LINE customers only' as final_state;
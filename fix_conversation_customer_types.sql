-- Fix conversations table to match updated customer roles

-- Check conversations with mismatched customer types (handle LINE user IDs vs UUIDs)
SELECT
  conv.id as conversation_id,
  conv.customer_type::text as conv_customer_type,
  conv.customer_ref,
  c.role::text as actual_customer_role,
  c.name as customer_name,
  CASE
    WHEN conv.customer_type::text != c.role::text THEN '❌ Mismatch - needs update'
    ELSE '✅ Match'
  END as status
FROM conversations conv
JOIN customers c ON (
  -- For LINE customers, customer_ref is LINE user ID
  (conv.customer_type = 'line' AND c.line_user_id = conv.customer_ref) OR
  -- For other customers, customer_ref is customer UUID
  (conv.customer_type != 'line' AND c.id = conv.customer_ref::uuid)
)
WHERE conv.customer_type::text != c.role::text
ORDER BY conv.created_at DESC;

-- Update conversation customer types to match actual customer roles
UPDATE conversations
SET customer_type = c.role::customer_type_enum
FROM customers c
WHERE (
  -- For LINE customers, customer_ref is LINE user ID
  (conversations.customer_type = 'line' AND c.line_user_id = conversations.customer_ref) OR
  -- For other customers, customer_ref is customer UUID
  (conversations.customer_type != 'line' AND c.id = conversations.customer_ref::uuid)
)
AND conversations.customer_type::text != c.role::text;

-- Verify the fix worked
SELECT
  conv.customer_type,
  COUNT(*) as conversations,
  COUNT(DISTINCT conv.customer_ref) as unique_customers
FROM conversations conv
GROUP BY conv.customer_type
ORDER BY conv.customer_type;

-- Final verification - should match customer table roles
SELECT
  'Conversation types should match customer roles:' as verification,
  COUNT(CASE WHEN conv.customer_type::text = c.role::text THEN 1 END) as matching_conversations,
  COUNT(CASE WHEN conv.customer_type::text != c.role::text THEN 1 END) as mismatched_conversations,
  CASE
    WHEN COUNT(CASE WHEN conv.customer_type::text != c.role::text THEN 1 END) = 0 THEN '✅ All conversations match customer roles'
    ELSE '❌ Still have mismatches'
  END as status
FROM conversations conv
JOIN customers c ON (
  -- For LINE customers, customer_ref is LINE user ID
  (conv.customer_type = 'line' AND c.line_user_id = conv.customer_ref) OR
  -- For other customers, customer_ref is customer UUID
  (conv.customer_type != 'line' AND c.id = conv.customer_ref::uuid)
);
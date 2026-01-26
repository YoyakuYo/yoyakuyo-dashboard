-- CHECK VALID ENUM VALUES FOR customer_role
SELECT
  'VALID customer_role enum values:' as enum_check,
  n.nspname as schema_name,
  t.typname as type_name,
  e.enumlabel as allowed_value,
  e.enumsortorder as sort_order
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
LEFT JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typname = 'customer_role'
ORDER BY e.enumsortorder;

-- CHECK WHAT VALUES ACTUALLY EXIST IN customers.role
SELECT
  'ACTUAL role values in customers table:' as existing,
  role,
  COUNT(*) as count
FROM customers
GROUP BY role
ORDER BY count DESC;

-- CORRECTED DIAGNOSTIC QUERY WITH PROPER ENUM VALUES
SELECT
  'CONVERSATION IDs FOR ALL CUSTOMERS (not just guests):' as diagnosis,
  conv.id as conversation_id,
  COALESCE(c.name, 'Unknown') as customer_name,
  conv.customer_type,
  conv.customer_ref,
  conv.created_at
FROM conversations conv
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type::text = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
WHERE conv.customer_type::text IN ('guest', 'line', 'customer')
ORDER BY conv.created_at DESC
LIMIT 15;

-- CHECK MESSAGE DISTRIBUTION FOR ALL CUSTOMERS
SELECT
  'MESSAGE DISTRIBUTION FOR ALL CUSTOMERS:' as check,
  conv.id as conversation_id,
  COALESCE(c.name, conv.customer_ref) as customer_identifier,
  conv.customer_type,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as latest_message
FROM conversations conv
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type::text = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
LEFT JOIN messages m ON m.conversation_id = conv.id
WHERE conv.customer_type::text IN ('guest', 'line', 'customer')
GROUP BY conv.id, c.name, conv.customer_ref, conv.customer_type
ORDER BY message_count DESC, conv.created_at DESC
LIMIT 15;

-- IDENTIFY THE ROUTING BUG FOR ALL CUSTOMERS
SELECT
  'MESSAGING BUG ANALYSIS FOR ALL CUSTOMERS:' as analysis,
  (SELECT COUNT(DISTINCT conversation_id) FROM messages) as conversations_with_messages,
  (SELECT COUNT(*) FROM conversations WHERE customer_type::text IN ('guest', 'line', 'customer')) as total_customer_conversations,
  (SELECT COUNT(*) FROM messages) as total_messages,
  CASE
    WHEN (SELECT COUNT(DISTINCT conversation_id) FROM messages) = 1
    THEN '❌ CRITICAL BUG: ALL ' || (SELECT COUNT(*) FROM messages) || ' messages in 1 conversation!'
    WHEN (SELECT COUNT(DISTINCT conversation_id) FROM messages) < (SELECT COUNT(*) FROM conversations WHERE customer_type::text IN ('guest', 'line', 'customer'))
    THEN '⚠️ PARTIAL BUG: Messages only in ' || (SELECT COUNT(DISTINCT conversation_id) FROM messages) || ' of ' || (SELECT COUNT(*) FROM conversations WHERE customer_type::text IN ('guest', 'line', 'customer')) || ' conversations'
    ELSE '✅ Messages properly distributed across conversations'
  END as bug_status;
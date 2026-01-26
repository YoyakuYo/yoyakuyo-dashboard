-- Check what customer_ref is stored in the conversation for this customer
SELECT
  conv.id as conversation_id,
  conv.customer_type,
  conv.customer_ref,
  conv.created_at,
  c.name as actual_customer_name,
  c.line_user_id,
  c.id as actual_customer_id
FROM conversations conv
LEFT JOIN customers c ON (
  (conv.customer_type = 'line' AND c.line_user_id = conv.customer_ref) OR
  (conv.customer_type IN ('web', 'guest') AND c.id = conv.customer_ref::uuid)
)
WHERE conv.customer_ref IN (
  '78fea290-ef9a-43c8-96d6-90460c04efe5',  -- customer ID
  'Uf5741397f874c9a5822578e506f0cb47'     -- LINE user ID
);

-- Check if there are multiple conversations or if the customer_ref is wrong
SELECT
  conv.id,
  conv.customer_type,
  conv.customer_ref,
  conv.created_at,
  c.id as matched_customer_id,
  c.name as matched_customer_name
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type = 'line'
ORDER BY conv.created_at DESC
LIMIT 5;

-- Check all conversations to see the pattern
SELECT
  conv.customer_type,
  COUNT(*) as conversation_count,
  COUNT(DISTINCT conv.customer_ref) as unique_refs
FROM conversations conv
GROUP BY conv.customer_type;
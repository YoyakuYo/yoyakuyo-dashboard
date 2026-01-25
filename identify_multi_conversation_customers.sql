-- Identify the customers who had multiple conversations

-- Show details of customers with multiple conversations
SELECT
  'MULTI-CONVERSATION CUSTOMERS:' as report,
  CASE
    WHEN conv.customer_type = 'line' THEN 'LINE Customer'
    ELSE 'Guest Customer'
  END as customer_type,
  c.name as customer_name,
  c.email,
  conv.customer_ref,
  COUNT(conv.id) as total_conversations,
  STRING_AGG(DISTINCT conv.created_at::date::text, ', ' ORDER BY conv.created_at) as conversation_dates,
  STRING_AGG(DISTINCT conv.id::text, ', ' ORDER BY conv.created_at) as conversation_ids
FROM conversations conv
LEFT JOIN customers c ON (
  CASE
    WHEN conv.customer_type = 'line' THEN c.line_user_id = conv.customer_ref
    ELSE c.id = conv.customer_ref::uuid
  END
)
WHERE (conv.customer_type::text, conv.customer_ref) IN (
  SELECT customer_type::text, customer_ref
  FROM conversations
  GROUP BY customer_type, customer_ref
  HAVING COUNT(*) > 1
)
GROUP BY conv.customer_type, conv.customer_ref, c.id, c.name, c.email
ORDER BY total_conversations DESC;

-- Show all conversations for these customers
SELECT
  'DETAILED CONVERSATION BREAKDOWN:' as details,
  CASE
    WHEN conv.customer_type = 'line' THEN 'LINE Customer'
    ELSE 'Guest Customer'
  END as customer_type,
  c.name as customer_name,
  conv.id as conversation_id,
  conv.created_at::date as conversation_date,
  COUNT(msg.id) as messages_in_conversation,
  LEFT(STRING_AGG(COALESCE(msg.content, ''), ' '), 100) as recent_messages_preview
FROM conversations conv
LEFT JOIN customers c ON (
  CASE
    WHEN conv.customer_type = 'line' THEN c.line_user_id = conv.customer_ref
    ELSE c.id = conv.customer_ref::uuid
  END
)
LEFT JOIN messages msg ON msg.conversation_id = conv.id
WHERE (conv.customer_type::text, conv.customer_ref) IN (
  SELECT customer_type::text, customer_ref
  FROM conversations
  GROUP BY customer_type, customer_ref
  HAVING COUNT(*) > 1
)
GROUP BY conv.customer_type, conv.customer_ref, c.id, c.name, conv.id, conv.created_at
ORDER BY c.name, conv.created_at;
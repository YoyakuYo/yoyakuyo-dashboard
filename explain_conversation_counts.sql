-- Explain why conversation counts differ from unique customer counts

-- Show detailed breakdown of LINE customer conversations
SELECT
  'LINE Customer Analysis:' as analysis,
  c.name,
  c.line_user_id,
  COUNT(conv.id) as conversations_for_this_customer,
  STRING_AGG(DISTINCT conv.id::text, ', ') as conversation_ids,
  STRING_AGG(DISTINCT conv.created_at::date::text, ', ') as conversation_dates
FROM customers c
JOIN conversations conv ON (
  (conv.customer_type = 'line' AND conv.customer_ref = c.line_user_id) OR
  (conv.customer_type != 'line' AND conv.customer_ref::uuid = c.id)
)
WHERE c.role = 'line'
GROUP BY c.id, c.name, c.line_user_id;

-- Show detailed breakdown of guest conversations
SELECT
  'Guest Customer Analysis:' as analysis,
  c.name,
  COUNT(conv.id) as conversations_for_this_customer,
  STRING_AGG(DISTINCT conv.id::text, ', ') as conversation_ids
FROM customers c
LEFT JOIN conversations conv ON conv.customer_ref::uuid = c.id AND conv.customer_type = 'guest'
WHERE c.role = 'guest'
GROUP BY c.id, c.name
ORDER BY conversations_for_this_customer DESC
LIMIT 10;

-- Show why some customers have multiple conversations
SELECT
  'Multi-conversation customers:' as analysis,
  customer_type::text,
  customer_ref,
  COUNT(*) as conversation_count,
  STRING_AGG(created_at::date::text, ', ' ORDER BY created_at) as dates
FROM conversations
GROUP BY customer_type, customer_ref
HAVING COUNT(*) > 1
ORDER BY conversation_count DESC;

-- Normal explanation
SELECT
  'WHY THIS IS NORMAL:' as explanation,
  'Customers can have multiple conversations for:' as reason_1,
  '- Multiple bookings (different appointments)' as reason_2,
  '- Follow-up conversations' as reason_3,
  '- Reopened conversations' as reason_4,
  '- System-created threads for different purposes' as reason_5;
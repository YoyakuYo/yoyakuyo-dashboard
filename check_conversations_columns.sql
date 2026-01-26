-- CHECK EXACT COLUMNS IN CONVERSATIONS TABLE
SELECT
  'Conversations table columns:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conversations'
ORDER BY ordinal_position;

-- SEE WHAT AN EXISTING CONVERSATION LOOKS LIKE
SELECT
  'Example existing conversation:' as sample,
  id,
  type,
  conversation_type,
  target_type,
  target_id,
  customer_type,
  customer_ref,
  created_at
FROM conversations
WHERE customer_type::text = 'guest'
LIMIT 1;
-- VERIFY DATABASE STRUCTURE FIRST (as requested)

-- CHECK CONVERSATIONS TABLE STRUCTURE
SELECT
  'Conversations table columns:' as structure,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conversations'
ORDER BY ordinal_position;

-- CHECK CUSTOMERS TABLE STRUCTURE
SELECT
  'Customers table columns:' as structure,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- CHECK MESSAGES TABLE STRUCTURE
SELECT
  'Messages table columns:' as structure,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'messages'
ORDER BY ordinal_position;

-- CHECK PARTICIPANTS TABLE STRUCTURE
SELECT
  'Conversation_participants table columns:' as structure,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conversation_participants'
ORDER BY ordinal_position;

-- SAMPLE DATA TO UNDERSTAND RELATIONSHIPS
SELECT
  'Sample conversations data:' as sample,
  id, conversation_type, customer_type, customer_ref, target_id
FROM conversations
WHERE customer_type::text IN ('guest', 'line')
LIMIT 3;

SELECT
  'Sample customers data:' as sample,
  id, name, email, role, line_user_id
FROM customers
WHERE role IN ('guest', 'customer')
LIMIT 3;

SELECT
  'Sample messages data:' as sample,
  id, conversation_id, sender_id, content
FROM messages
LIMIT 3;
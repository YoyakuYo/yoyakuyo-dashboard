-- CHECK THE UNIQUE CONSTRAINTS ON conversation_participants TABLE
SELECT
  'conversation_participants constraints:' as check,
  conname as constraint_name,
  conkey as constraint_keys,
  confkey as referenced_keys,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
    ELSE 'OTHER'
  END as constraint_type
FROM pg_constraint
WHERE conrelid = (
  SELECT oid FROM pg_class
  WHERE relname = 'conversation_participants'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
);

-- CHECK WHAT COLUMNS ARE IN THE TABLE
SELECT
  'conversation_participants columns:' as columns,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conversation_participants'
ORDER BY ordinal_position;

-- TRY INSERT WITHOUT ON CONFLICT FIRST TO SEE IF IT WORKS
INSERT INTO conversation_participants (
  conversation_id,
  user_id,
  participant_type,
  shop_id,
  created_at
)
SELECT
  conv.id,
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  'owner',
  conv.target_id::uuid,
  NOW()
FROM conversations conv
WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420'
  AND NOT EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conv.id
    AND cp.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
  );

-- VERIFY THE INSERT WORKED
SELECT
  'After insert - Yhikh participants:' as check,
  cp.conversation_id,
  cp.user_id,
  cp.participant_type,
  cp.created_at
FROM conversation_participants cp
WHERE cp.conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420';
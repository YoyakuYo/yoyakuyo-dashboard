-- CHECK THE EXACT CHECK CONSTRAINT DEFINITION
SELECT
  'EXACT check constraint for participant_type:' as critical_info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as exact_definition
FROM pg_constraint
WHERE conrelid = (
  SELECT oid FROM pg_class WHERE relname = 'conversation_participants'
) AND contype = 'c' AND conname LIKE '%participant_type%';

-- SEE ALL EXISTING VALUES THAT WORK
SELECT
  'ALL existing participant_type values that WORK:' as working_values,
  participant_type,
  COUNT(*) as count
FROM conversation_participants
GROUP BY participant_type
ORDER BY count DESC;

-- LOOK AT THE ENUM TYPE DEFINITION IF IT EXISTS
SELECT
  'Check if participant_type is an enum:' as enum_check,
  n.nspname as schema_name,
  t.typname as type_name,
  e.enumlabel as allowed_value
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
LEFT JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typname = 'participant_type_enum'
ORDER BY e.enumsortorder;

-- TRY USING WHATEVER VALUE IS MOST COMMON IN EXISTING DATA
SELECT
  'MOST COMMON participant_type (try this one):' as suggestion,
  participant_type,
  COUNT(*) as count
FROM conversation_participants
GROUP BY participant_type
ORDER BY count DESC
LIMIT 1;

-- USE THE MOST COMMON VALUE FROM EXISTING DATA
INSERT INTO conversation_participants (
  conversation_id,
  user_id,
  participant_type,  -- Use whatever is most common
  participant_ref,
  shop_id,
  created_at
)
SELECT
  'b1178685-b981-4191-bf52-2ecad8d66420',
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  (
    SELECT participant_type
    FROM conversation_participants
    GROUP BY participant_type
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ),  -- Use the most common existing value
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  '0bfa803b-230e-4b80-872e-434c3cbfee7c'::uuid,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM conversation_participants
  WHERE conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420'
  AND user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
);
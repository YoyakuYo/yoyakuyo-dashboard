-- CHECK EXACT PARTICIPANTS TABLE STRUCTURE - SOMETHING IS WRONG
SELECT
  'ALL TABLES IN DATABASE:' as check,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%participant%'
ORDER BY table_name;

-- CHECK IF PARTICIPANTS TABLE EXISTS AT ALL
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'participants'
    )
    THEN '✅ Participants table exists'
    ELSE '❌ Participants table does NOT exist'
  END as table_exists;

-- IF EXISTS, SHOW EXACT STRUCTURE
SELECT
  'Participants table exact structure:' as structure,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'participants'
ORDER BY ordinal_position;

-- SHOW ANY DATA IN PARTICIPANTS TABLE
SELECT
  'Any existing participants data:' as data_check,
  COUNT(*) as total_participants
FROM participants;

-- SHOW SAMPLE DATA IF EXISTS
SELECT
  'Sample participants data:' as sample,
  *
FROM participants
LIMIT 5;

-- ALTERNATIVE: CHECK IF THERE'S A DIFFERENT PARTICIPANTS SYSTEM
SELECT
  'Check for alternative participant systems:' as alternative,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%user%' OR table_name LIKE '%member%' OR table_name LIKE '%chat%')
ORDER BY table_name;
-- Check participants table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'participants'
ORDER BY ordinal_position;
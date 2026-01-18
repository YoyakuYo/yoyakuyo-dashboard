-- Check if analytics indexes exist
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND (indexname LIKE '%booking%' OR indexname LIKE '%payment%' OR indexname LIKE '%shop%' OR indexname LIKE '%review%')
ORDER BY tablename, indexname;

-- Check all triggers on shops table
SELECT 
  'Triggers on shops' AS check_type,
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'shops'
ORDER BY trigger_name;

-- Check trigger functions that might reference 'name'
SELECT 
  'Trigger Functions' AS check_type,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
  AND routine_definition LIKE '%shops%'
  AND routine_definition LIKE '%name%'
ORDER BY routine_name;


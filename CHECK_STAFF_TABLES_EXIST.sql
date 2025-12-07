-- Check what staff-related tables actually exist
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%staff%'
ORDER BY table_name;

-- Check if staff_profiles exists in any schema
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name = 'staff_profiles';

-- Check all tables that might be for platform staff
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%admin%'
    OR table_name LIKE '%manager%'
    OR table_name LIKE '%verifier%'
    OR table_name LIKE '%platform%'
  )
ORDER BY table_name;


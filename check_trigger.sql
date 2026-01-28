-- Check current auto_create_booking_conversation trigger function
SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'auto_create_booking_conversation';

-- Check bookings table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
ORDER BY ordinal_position;

-- Check if customer_profile_id column exists in bookings
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'customer_profile_id'
) AS customer_profile_id_exists;

-- Check current trigger definition
SELECT
    t.tgname AS trigger_name,
    CASE t.tgtype::integer & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END AS timing,
    CASE t.tgtype::integer & 28
        WHEN 16 THEN 'UPDATE'
        WHEN 8 THEN 'DELETE'
        WHEN 4 THEN 'INSERT'
        WHEN 20 THEN 'INSERT, UPDATE'
        WHEN 28 THEN 'INSERT, UPDATE, DELETE'
        ELSE 'UNKNOWN'
    END AS events,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'bookings'
  AND NOT t.tgisinternal
ORDER BY t.tgname;
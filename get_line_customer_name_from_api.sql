-- Check if we can get LINE customer name from LINE API profile data
-- This would require LINE API access, but let's see what we have stored

-- Check if there are any LINE profile data tables or fields
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name ILIKE '%line%'
ORDER BY table_name;

-- Check if there are any profile or user data tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name ILIKE '%profile%' OR table_name ILIKE '%user%')
ORDER BY table_name;

-- Check all columns across all tables for any name-related fields for this customer
DO $$
DECLARE
    table_record RECORD;
    name_found BOOLEAN := FALSE;
BEGIN
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('schema_migrations')
    LOOP
        -- Check if this table has customer_id or similar foreign key
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = table_record.table_name
              AND column_name IN ('customer_id', 'user_id', 'customer_ref')
        ) THEN
            -- Check if this table has name-related columns
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = table_record.table_name
                  AND column_name ILIKE '%name%'
            ) THEN
                RAISE NOTICE 'Table % has name-related columns and customer reference', table_record.table_name;

                -- Try to find data for our customer
                BEGIN
                    EXECUTE format('
                        SELECT COUNT(*) as records_found
                        FROM %I
                        WHERE customer_id = %L OR user_id = %L OR customer_ref = %L
                    ', table_record.table_name, '78fea290-ef9a-43c8-96d6-90460c04efe5', '78fea290-ef9a-43c8-96d6-90460c04efe5', '78fea290-ef9a-43c8-96d6-90460c04efe5');
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE NOTICE 'Could not query table %: %', table_record.table_name, SQLERRM;
                END;
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE 'Scan complete. Customer name not found in existing tables.';
END $$;

-- Check if LINE user profile data might be available via API
-- This would require checking LINE API documentation or webhook data
SELECT
  la.line_user_id,
  la.customer_id,
  la.created_at
FROM line_accounts la
WHERE la.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Suggestion: Update booking flow to collect customer name
-- Or create a message asking for the name
SELECT
  'To get the customer name, you could:' as suggestion,
  '1. Ask the customer in LINE chat' as option_1,
  '2. Add name collection to booking flow' as option_2,
  '3. Use LINE API to get profile (requires LINE Login)' as option_3;
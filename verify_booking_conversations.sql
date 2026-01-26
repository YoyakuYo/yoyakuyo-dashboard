-- ============================================================================
-- VERIFICATION: Check booking conversations status
-- ============================================================================
-- Run this to see what's missing before applying migrations/repairs
-- ============================================================================

-- 1) Check if conversation_id column exists in bookings table
SELECT
    'conversation_id column exists' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'bookings'
              AND column_name = 'conversation_id'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run: supabase/migrations/20260125014000_add_bookings_conversation_id.sql'
    END as status;

-- 2) Check if the foreign key constraint exists
SELECT
    'conversation_id foreign key exists' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'bookings_conversation_id_fkey'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - Will be created by the migration'
    END as status;

-- 3) Check if the trigger exists
SELECT
    'booking conversation trigger exists' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = 'trg_create_conversation'
              AND tgrelid = 'bookings'::regclass
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run: supabase/migrations/20260125013000_create_conversation_for_booking_trigger.sql'
    END as status;

-- 4) Count bookings without conversation_id
SELECT
    'bookings without conversation_id' as check_name,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) > 0 THEN '❌ NEED REPAIR - Run repair script'
        ELSE '✅ ALL GOOD'
    END as status
FROM bookings
WHERE conversation_id IS NULL;

-- 5) Count bookings with conversation_id but no matching conversation
SELECT
    'bookings with orphaned conversation_id' as check_name,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) > 0 THEN '❌ NEED CLEANUP'
        ELSE '✅ ALL GOOD'
    END as status
FROM bookings b
LEFT JOIN conversations c ON c.id = b.conversation_id
WHERE b.conversation_id IS NOT NULL
  AND c.id IS NULL;

-- 6) Count conversations without booking_id (should be 0 for booking conversations)
SELECT
    'conversations missing booking_id' as check_name,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) > 0 THEN '⚠️  WARNING - Some conversations not linked to bookings'
        ELSE '✅ ALL GOOD'
    END as status
FROM conversations
WHERE conversation_type = 'booking_owner'
  AND booking_id IS NULL;

-- 7) Count recent bookings (last 30 days) to see if trigger is working
SELECT
    'recent bookings created' as check_name,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) > 0 THEN 'ℹ️  Check if these have conversations'
        ELSE 'ℹ️  No recent bookings'
    END as status
FROM bookings
WHERE created_at > NOW() - INTERVAL '30 days';

-- 8) Count recent bookings without conversation_id
SELECT
    'recent bookings without conversation_id' as check_name,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) > 0 THEN '❌ TRIGGER NOT WORKING - Recent bookings missing conversations'
        ELSE '✅ TRIGGER WORKING'
    END as status
FROM bookings
WHERE created_at > NOW() - INTERVAL '30 days'
  AND conversation_id IS NULL;

-- 9) Sample of bookings with customer info
SELECT
    'Sample bookings with customer info' as check_name,
    COUNT(*) as sample_count,
    'Check these have conversations' as notes
FROM (
    SELECT b.id, b.customer_id, b.created_at,
           c.email as customer_email, c.name as customer_name, c.role as customer_role
    FROM bookings b
    LEFT JOIN customers c ON c.id = b.customer_id
    WHERE b.customer_id IS NOT NULL
    LIMIT 5
) sample;
-- ============================================================================
-- QUICK VERIFICATION: Booking Conversations Status
-- ============================================================================
-- Run this in Supabase SQL Editor to check what's missing
-- ============================================================================

-- Check if conversation_id column exists
SELECT 'conversation_id column exists:' as check,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'bookings'
           AND column_name = 'conversation_id'
       ) THEN '✅ YES' ELSE '❌ NO - NEED MIGRATION' END as status;

-- Check trigger exists
SELECT 'booking trigger exists:' as check,
       CASE WHEN EXISTS (
           SELECT 1 FROM pg_trigger
           WHERE tgname = 'trg_create_conversation'
       ) THEN '✅ YES' ELSE '❌ NO - NEED TRIGGER' END as status;

-- Count bookings without conversation_id
SELECT 'bookings missing conversation_id:' as check,
       COUNT(*) as count,
       CASE WHEN COUNT(*) > 0 THEN '❌ NEED REPAIR' ELSE '✅ ALL GOOD' END as status
FROM bookings WHERE conversation_id IS NULL;

-- Count recent bookings without conversation_id (last 7 days)
SELECT 'recent bookings (7 days) missing conversation_id:' as check,
       COUNT(*) as count,
       CASE WHEN COUNT(*) > 0 THEN '❌ TRIGGER BROKEN' ELSE '✅ TRIGGER WORKING' END as status
FROM bookings
WHERE created_at > NOW() - INTERVAL '7 days'
  AND conversation_id IS NULL;
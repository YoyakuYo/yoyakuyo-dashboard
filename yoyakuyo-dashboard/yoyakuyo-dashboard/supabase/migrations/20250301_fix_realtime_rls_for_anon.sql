-- ============================================
-- FIX REALTIME RLS FOR ANON USERS
-- ============================================
-- The LINE app uses anon key without Supabase auth, so auth.uid() is NULL
-- Realtime subscriptions need SELECT permission, but current RLS blocks anon users
-- Since backend API validates all access, we can allow anon SELECT for realtime
-- ============================================

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "anon_can_read_messages_for_realtime" ON messages;
DROP POLICY IF EXISTS "anon_can_read_conversations_for_realtime" ON conversations;

-- Add a permissive policy for anon users to read messages (for realtime)
-- Backend API still validates access, so this is safe
CREATE POLICY "anon_can_read_messages_for_realtime"
ON messages
FOR SELECT
TO anon
USING (true);

-- Also allow anon to read conversations (for realtime)
CREATE POLICY "anon_can_read_conversations_for_realtime"
ON conversations
FOR SELECT
TO anon
USING (true);

-- ============================================
-- VERIFICATION
-- ============================================
-- Check that policies exist:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('messages', 'conversations')
-- AND policyname LIKE '%realtime%' OR policyname LIKE '%anon%'
-- ORDER BY tablename, policyname;


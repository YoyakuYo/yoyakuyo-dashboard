-- Fix visitor tracking RLS policy and add unique constraint
-- This fixes the admin RLS policy and ensures session_id uniqueness

-- Drop the incorrect admin policy
DROP POLICY IF EXISTS "admins_read_all_visitor_sessions" ON visitor_sessions;

-- Recreate the admin policy with correct column reference (auth_user_id instead of id)
CREATE POLICY "admins_read_all_visitor_sessions"
ON visitor_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.auth_user_id = auth.uid()
      AND c.is_admin = true
  )
);

-- Add unique constraint on session_id to support upsert operations
-- First, check if constraint already exists to avoid errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'visitor_sessions_session_id_key'
  ) THEN
    ALTER TABLE visitor_sessions 
    ADD CONSTRAINT visitor_sessions_session_id_key UNIQUE (session_id);
  END IF;
END $$;

-- Add comment
COMMENT ON POLICY "admins_read_all_visitor_sessions" ON visitor_sessions IS 
'Allows admins (customers with is_admin=true) to read all visitor session data';

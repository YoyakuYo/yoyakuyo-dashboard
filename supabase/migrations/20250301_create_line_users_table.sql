-- ============================================
-- CREATE LINE_USERS TABLE FOR REALTIME AUTH
-- ============================================
-- This table stores LINE user identities for Supabase JWT generation
-- Required for Supabase Realtime to work with LINE (LIFF) users
-- ============================================

-- Create line_users table
CREATE TABLE IF NOT EXISTS public.line_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_line_users_line_user_id ON public.line_users(line_user_id);

-- Enable RLS
ALTER TABLE public.line_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read their own record
CREATE POLICY "line_users_select_own"
ON public.line_users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- RLS Policy: Allow service role to do everything (for backend JWT generation)
-- Note: Service role bypasses RLS, but we add this for clarity

-- Add comment
COMMENT ON TABLE public.line_users IS 'Stores LINE user identities for Supabase JWT generation. Maps line_user_id to Supabase auth.uid()';


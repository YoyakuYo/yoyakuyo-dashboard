-- Migration: Add Google Calendar OAuth tokens table
-- This table stores refresh tokens for Google Calendar integration

CREATE TABLE IF NOT EXISTS user_google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_google_tokens_user_id ON user_google_tokens(user_id);

-- Add RLS policies
ALTER TABLE user_google_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tokens
CREATE POLICY "Users can view own Google tokens"
  ON user_google_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tokens
CREATE POLICY "Users can insert own Google tokens"
  ON user_google_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tokens
CREATE POLICY "Users can update own Google tokens"
  ON user_google_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own tokens
CREATE POLICY "Users can delete own Google tokens"
  ON user_google_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE user_google_tokens IS 'Stores Google Calendar OAuth refresh tokens for users';
COMMENT ON COLUMN user_google_tokens.refresh_token IS 'Google OAuth refresh token for calendar access';
COMMENT ON COLUMN user_google_tokens.access_token IS 'Current access token (may be refreshed)';
COMMENT ON COLUMN user_google_tokens.expires_at IS 'When the access token expires';


-- Migration: Add guest_id column to ai_conversations table
-- This allows proper isolation of guest conversations by unique guest ID

-- Add guest_id column if it doesn't exist
ALTER TABLE ai_conversations
ADD COLUMN IF NOT EXISTS guest_id TEXT;

-- Create index for guest_id lookups
CREATE INDEX IF NOT EXISTS ai_conversations_guest_id_idx 
ON ai_conversations(guest_id) 
WHERE guest_id IS NOT NULL;

-- Create unique constraint for guest conversations (guest_id + context_key)
-- This ensures each guest has only one conversation per context
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ai_conversations_guest_context_unique'
  ) THEN
    -- Create unique partial index for guest conversations
    CREATE UNIQUE INDEX ai_conversations_guest_context_unique 
    ON ai_conversations(guest_id, context_key) 
    WHERE user_type = 'guest' AND guest_id IS NOT NULL;
  END IF;
END $$;

-- Update existing guest conversations to have guest_id from messages metadata if possible
-- (This is a best-effort migration - new conversations will have guest_id set properly)

-- Add comment
COMMENT ON COLUMN ai_conversations.guest_id IS 'Unique guest identifier (from localStorage) for isolating guest conversations. Only used when user_type = guest.';


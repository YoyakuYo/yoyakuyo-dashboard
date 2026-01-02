-- Migration: Add support system to conversations table
-- This adds support ticket functionality to the existing conversations table
-- Support tickets are conversations flagged for admin attention

-- Step 1: Add is_support_ticket boolean column
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_support_ticket BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Create support_status enum
DO $$ BEGIN
  CREATE TYPE support_status AS ENUM ('open', 'in-progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Add support_status column
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS support_status support_status;

-- Step 4: Create indexes for support queries
CREATE INDEX IF NOT EXISTS idx_conversations_is_support_ticket 
  ON conversations(is_support_ticket) 
  WHERE is_support_ticket = true;

CREATE INDEX IF NOT EXISTS idx_conversations_support_status 
  ON conversations(support_status) 
  WHERE support_status IS NOT NULL;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN conversations.is_support_ticket IS 'True if this conversation is a support ticket requiring admin attention';
COMMENT ON COLUMN conversations.support_status IS 'Status of support ticket: open, in-progress, resolved, or closed';


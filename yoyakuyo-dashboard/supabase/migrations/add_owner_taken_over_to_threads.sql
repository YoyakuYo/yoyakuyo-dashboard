-- Migration: Add owner_taken_over field to shop_threads table
-- This allows owners to take over conversations from AI

ALTER TABLE shop_threads
ADD COLUMN IF NOT EXISTS owner_taken_over BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS shop_threads_owner_taken_over_idx ON shop_threads(owner_taken_over) WHERE owner_taken_over = TRUE;

-- Add comment
COMMENT ON COLUMN shop_threads.owner_taken_over IS 'Whether the owner has taken over this conversation from AI';


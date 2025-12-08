-- ============================================================================
-- ADD SUPPORT CONVERSATION CONSTRAINT
-- ============================================================================
-- This migration adds a unique constraint for support conversations
-- (owner_staff type with null staff_id) to ensure one support thread per shop+owner
-- ============================================================================

-- Add unique constraint for support conversations (owner_staff with null staff_id)
-- This ensures one support conversation per shop+owner combination
CREATE UNIQUE INDEX IF NOT EXISTS unique_support_conversation 
  ON conversations(shop_id, owner_id) 
  WHERE type = 'owner_staff' AND owner_id IS NOT NULL AND staff_id IS NULL;

-- Add comment
COMMENT ON INDEX unique_support_conversation IS 'Ensures one support conversation per shop+owner when staff_id is null';


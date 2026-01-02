-- Migration: Add conversation_state to ai_conversations
-- Purpose: Persist authoritative server-side conversation state to prevent context loss
-- Notes:
-- - Uses JSONB for flexible evolution
-- - Uses IF NOT EXISTS to avoid duplicate schema changes

ALTER TABLE IF EXISTS ai_conversations
ADD COLUMN IF NOT EXISTS conversation_state JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN ai_conversations.conversation_state IS
'Authoritative server-side conversation state (merged each turn). Used to prevent context loss and re-asking confirmed info.';



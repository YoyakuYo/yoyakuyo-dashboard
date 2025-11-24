-- Migration: Create owner_ai_messages table for persistent Owner AI conversation history
-- This table stores all messages between owners and the AI assistant

CREATE TABLE IF NOT EXISTS owner_ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    shop_id UUID,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS owner_ai_messages_owner_id_idx ON owner_ai_messages(owner_id);
CREATE INDEX IF NOT EXISTS owner_ai_messages_shop_id_idx ON owner_ai_messages(shop_id) WHERE shop_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS owner_ai_messages_created_at_idx ON owner_ai_messages(created_at DESC);

-- Enable RLS
ALTER TABLE owner_ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Owners can only see their own messages
CREATE POLICY "Owners can view their own AI messages"
    ON owner_ai_messages
    FOR SELECT
    USING (auth.uid() = owner_id);

-- RLS Policy: Owners can insert their own messages
CREATE POLICY "Owners can insert their own AI messages"
    ON owner_ai_messages
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- RLS Policy: Service role can insert assistant messages (for backend)
CREATE POLICY "Service role can insert assistant messages"
    ON owner_ai_messages
    FOR INSERT
    WITH CHECK (true); -- Service role bypasses RLS


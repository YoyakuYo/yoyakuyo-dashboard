-- Migration: Create ai_conversations table for unified chat persistence
-- This table stores all AI conversations for customers, owners, and guests

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'owner', 'guest')),
    user_id UUID, -- For customer/owner: auth user id, for guest: null
    shop_id UUID, -- Optional: shop context for the conversation
    context_key TEXT NOT NULL, -- e.g. 'customer_dashboard', 'owner_dashboard', 'public_landing'
    messages JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of message objects
    locale TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS ai_conversations_user_type_idx ON ai_conversations(user_type);
CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx ON ai_conversations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_conversations_context_key_idx ON ai_conversations(context_key);
CREATE INDEX IF NOT EXISTS ai_conversations_updated_at_idx ON ai_conversations(updated_at DESC);

-- Create unique constraint for guest conversations (by context_key and a generated guest_id stored in messages metadata)
-- For authenticated users, we'll use user_type + user_id + context_key as unique identifier

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Customers can read own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Customers can insert own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Customers can update own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Owners can read own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Owners can insert own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Owners can update own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Guests can read own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Guests can insert conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Guests can update own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Service role can manage all conversations" ON ai_conversations;

-- Customers can read/insert/update their own conversations
CREATE POLICY "Customers can read own conversations"
ON ai_conversations
FOR SELECT
TO authenticated
USING (
    user_type = 'customer' 
    AND user_id = auth.uid()
);

CREATE POLICY "Customers can insert own conversations"
ON ai_conversations
FOR INSERT
TO authenticated
WITH CHECK (
    user_type = 'customer' 
    AND user_id = auth.uid()
);

CREATE POLICY "Customers can update own conversations"
ON ai_conversations
FOR UPDATE
TO authenticated
USING (
    user_type = 'customer' 
    AND user_id = auth.uid()
)
WITH CHECK (
    user_type = 'customer' 
    AND user_id = auth.uid()
);

-- Owners can read/insert/update their own conversations
CREATE POLICY "Owners can read own conversations"
ON ai_conversations
FOR SELECT
TO authenticated
USING (
    user_type = 'owner' 
    AND user_id = auth.uid()
);

CREATE POLICY "Owners can insert own conversations"
ON ai_conversations
FOR INSERT
TO authenticated
WITH CHECK (
    user_type = 'owner' 
    AND user_id = auth.uid()
);

CREATE POLICY "Owners can update own conversations"
ON ai_conversations
FOR UPDATE
TO authenticated
USING (
    user_type = 'owner' 
    AND user_id = auth.uid()
)
WITH CHECK (
    user_type = 'owner' 
    AND user_id = auth.uid()
);

-- Guests can read/insert/update conversations (filtered by client-side cookie/localStorage)
-- Note: RLS for guests is permissive since we can't verify cookies in RLS
-- We'll rely on client-side filtering and service role for security
CREATE POLICY "Guests can read own conversations"
ON ai_conversations
FOR SELECT
USING (user_type = 'guest');

CREATE POLICY "Guests can insert conversations"
ON ai_conversations
FOR INSERT
WITH CHECK (user_type = 'guest');

CREATE POLICY "Guests can update own conversations"
ON ai_conversations
FOR UPDATE
USING (user_type = 'guest')
WITH CHECK (user_type = 'guest');

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role can manage all conversations"
ON ai_conversations
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comments
COMMENT ON TABLE ai_conversations IS 'Unified table for storing AI chat conversations for customers, owners, and guests';
COMMENT ON COLUMN ai_conversations.user_type IS 'Type of user: customer, owner, or guest';
COMMENT ON COLUMN ai_conversations.user_id IS 'Auth user ID for customer/owner, null for guests';
COMMENT ON COLUMN ai_conversations.context_key IS 'Context identifier: customer_dashboard, owner_dashboard, public_landing';
COMMENT ON COLUMN ai_conversations.messages IS 'JSONB array of message objects: [{role: user|assistant|system, content: string, timestamp: string}]';


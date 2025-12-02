-- Migration: Create customer_ai_messages table for persistent Customer AI conversation history
-- This table stores all messages between customers and the AI assistant on public pages

CREATE TABLE IF NOT EXISTS customer_ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT, -- Can be anonymous session ID or email
    shop_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS customer_ai_messages_customer_id_idx ON customer_ai_messages(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS customer_ai_messages_shop_id_idx ON customer_ai_messages(shop_id);
CREATE INDEX IF NOT EXISTS customer_ai_messages_created_at_idx ON customer_ai_messages(created_at DESC);

-- Enable RLS
ALTER TABLE customer_ai_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Owners can view customer AI messages for their shops" ON customer_ai_messages;
DROP POLICY IF EXISTS "Anyone can insert customer AI messages" ON customer_ai_messages;
DROP POLICY IF EXISTS "Service role can manage customer AI messages" ON customer_ai_messages;

-- RLS Policy: Shop owners can view messages for their shops
CREATE POLICY "Owners can view customer AI messages for their shops"
    ON customer_ai_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shops
            WHERE shops.id = customer_ai_messages.shop_id
            AND shops.owner_user_id = auth.uid()
        )
    );

-- RLS Policy: Anyone can insert messages (for public chat)
CREATE POLICY "Anyone can insert customer AI messages"
    ON customer_ai_messages
    FOR INSERT
    WITH CHECK (true);

-- RLS Policy: Service role can do everything (for backend)
CREATE POLICY "Service role can manage customer AI messages"
    ON customer_ai_messages
    FOR ALL
    USING (true)
    WITH CHECK (true);


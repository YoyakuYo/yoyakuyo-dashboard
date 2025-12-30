-- Migration: Create shop_threads and shop_messages tables
-- These tables are essential for the AI chat and LINE integration features

-- ============================================================================
-- 1. CREATE shop_threads TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS shop_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    customer_email TEXT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    line_user_id VARCHAR(255),
    owner_taken_over BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for shop_threads
CREATE INDEX IF NOT EXISTS shop_threads_shop_id_idx ON shop_threads(shop_id);
CREATE INDEX IF NOT EXISTS shop_threads_booking_id_idx ON shop_threads(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS shop_threads_customer_email_idx ON shop_threads(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS shop_threads_customer_id_idx ON shop_threads(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS shop_threads_line_user_id_idx ON shop_threads(shop_id, line_user_id) WHERE line_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS shop_threads_owner_taken_over_idx ON shop_threads(owner_taken_over) WHERE owner_taken_over = TRUE;
CREATE INDEX IF NOT EXISTS shop_threads_created_at_idx ON shop_threads(created_at);

-- Enable RLS
ALTER TABLE shop_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_threads
-- Shop owners can view threads for their shops
CREATE POLICY "Shop owners can view their shop threads"
    ON shop_threads
    FOR SELECT
    USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_user_id = auth.uid()
        )
    );

-- Allow service role to manage threads (for API)
-- Service role bypasses RLS, so this is mainly for documentation

-- Add comment
COMMENT ON TABLE shop_threads IS 'Conversation threads linking shops, customers, and bookings for AI chat and LINE integration';

-- ============================================================================
-- 2. CREATE shop_messages TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS shop_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES shop_threads(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'owner', 'ai')),
    content TEXT NOT NULL,
    sender_id TEXT, -- Can be LINE user ID, owner user ID, or null for AI
    read_by_owner BOOLEAN DEFAULT FALSE,
    read_by_customer BOOLEAN DEFAULT FALSE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for shop_messages
CREATE INDEX IF NOT EXISTS shop_messages_thread_id_idx ON shop_messages(thread_id);
CREATE INDEX IF NOT EXISTS shop_messages_sender_type_idx ON shop_messages(sender_type);
CREATE INDEX IF NOT EXISTS shop_messages_booking_id_idx ON shop_messages(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS shop_messages_read_by_owner_idx ON shop_messages(read_by_owner) WHERE read_by_owner = FALSE;
CREATE INDEX IF NOT EXISTS shop_messages_read_by_customer_idx ON shop_messages(read_by_customer) WHERE read_by_customer = FALSE;
CREATE INDEX IF NOT EXISTS shop_messages_created_at_idx ON shop_messages(created_at);
CREATE INDEX IF NOT EXISTS shop_messages_thread_created_idx ON shop_messages(thread_id, created_at);

-- Enable RLS
ALTER TABLE shop_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_messages
-- Shop owners can view messages in their shop threads
CREATE POLICY "Shop owners can view their shop messages"
    ON shop_messages
    FOR SELECT
    USING (
        thread_id IN (
            SELECT id FROM shop_threads
            WHERE shop_id IN (
                SELECT id FROM shops WHERE owner_user_id = auth.uid()
            )
        )
    );

-- Customers can view messages in their threads (via customer_email or customer_id)
-- Note: This is complex with RLS, so API uses service role for now
-- In production, you might want to add customer-specific policies

-- Add comment
COMMENT ON TABLE shop_messages IS 'Messages within conversation threads for AI chat, owner communication, and LINE integration';

-- ============================================================================
-- 3. CREATE shop_owner_unread_counts VIEW (SECURITY DEFINER)
-- ============================================================================
-- This view aggregates unread message counts per shop and thread for owners
-- Created as SECURITY DEFINER function + view for proper access control

-- First, create a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION get_shop_owner_unread_counts()
RETURNS TABLE (
    shop_id UUID,
    thread_id UUID,
    unread_count BIGINT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
    SELECT 
        st.shop_id,
        st.id AS thread_id,
        COALESCE(COUNT(sm.id) FILTER (WHERE sm.read_by_owner = FALSE AND sm.sender_type != 'owner'), 0)::BIGINT AS unread_count
    FROM shop_threads st
    LEFT JOIN shop_messages sm ON sm.thread_id = st.id
    GROUP BY st.shop_id, st.id;
$$;

-- Create a view that wraps the function
DROP VIEW IF EXISTS shop_owner_unread_counts CASCADE;
CREATE VIEW shop_owner_unread_counts AS
SELECT * FROM get_shop_owner_unread_counts();

-- Grant access to the view
GRANT SELECT ON shop_owner_unread_counts TO authenticated;
GRANT SELECT ON shop_owner_unread_counts TO anon;

-- Add comment
COMMENT ON VIEW shop_owner_unread_counts IS 'Aggregates unread message counts per shop and thread for owners (SECURITY DEFINER view)';

-- ============================================================================
-- 4. ADD TRIGGERS FOR updated_at
-- ============================================================================
-- Trigger for shop_threads updated_at
CREATE OR REPLACE FUNCTION update_shop_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shop_threads_updated_at ON shop_threads;
CREATE TRIGGER update_shop_threads_updated_at
    BEFORE UPDATE ON shop_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_shop_threads_updated_at();

-- Trigger for shop_messages updated_at
CREATE OR REPLACE FUNCTION update_shop_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shop_messages_updated_at ON shop_messages;
CREATE TRIGGER update_shop_messages_updated_at
    BEFORE UPDATE ON shop_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_shop_messages_updated_at();


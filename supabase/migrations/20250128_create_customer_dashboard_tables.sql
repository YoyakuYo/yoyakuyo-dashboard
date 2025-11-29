-- Migration: Create customer dashboard tables
-- This migration creates all necessary tables for customer accounts, favorites, chat, and notifications

-- ============================================
-- 1. customer_profiles table
-- ============================================
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint on email
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customer_profiles_email_unique'
          AND conrelid = 'customer_profiles'::regclass
    ) THEN
        ALTER TABLE customer_profiles 
        ADD CONSTRAINT customer_profiles_email_unique UNIQUE (email);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS customer_profiles_email_idx ON customer_profiles(email);

-- Enable RLS
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_profiles
DROP POLICY IF EXISTS "Customers can read own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Customers can insert own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Customers can update own profile" ON customer_profiles;

CREATE POLICY "Customers can read own profile"
ON customer_profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Customers can insert own profile"
ON customer_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers can update own profile"
ON customer_profiles
FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- 2. customer_favorites table
-- ============================================
CREATE TABLE IF NOT EXISTS customer_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, shop_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS customer_favorites_customer_id_idx ON customer_favorites(customer_id);
CREATE INDEX IF NOT EXISTS customer_favorites_shop_id_idx ON customer_favorites(shop_id);

-- Enable RLS
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_favorites
DROP POLICY IF EXISTS "Customers can read own favorites" ON customer_favorites;
DROP POLICY IF EXISTS "Customers can insert own favorites" ON customer_favorites;
DROP POLICY IF EXISTS "Customers can delete own favorites" ON customer_favorites;

CREATE POLICY "Customers can read own favorites"
ON customer_favorites
FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert own favorites"
ON customer_favorites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can delete own favorites"
ON customer_favorites
FOR DELETE
USING (auth.uid() = customer_id);

-- ============================================
-- 3. customer_chat_sessions table
-- ============================================
CREATE TABLE IF NOT EXISTS customer_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS customer_chat_sessions_customer_id_idx ON customer_chat_sessions(customer_id);
CREATE INDEX IF NOT EXISTS customer_chat_sessions_updated_at_idx ON customer_chat_sessions(updated_at DESC);

-- Enable RLS
ALTER TABLE customer_chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_chat_sessions
DROP POLICY IF EXISTS "Customers can read own sessions" ON customer_chat_sessions;
DROP POLICY IF EXISTS "Customers can insert own sessions" ON customer_chat_sessions;
DROP POLICY IF EXISTS "Customers can update own sessions" ON customer_chat_sessions;

CREATE POLICY "Customers can read own sessions"
ON customer_chat_sessions
FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert own sessions"
ON customer_chat_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own sessions"
ON customer_chat_sessions
FOR UPDATE
USING (auth.uid() = customer_id);

-- ============================================
-- 4. customer_chat_messages table
-- ============================================
CREATE TABLE IF NOT EXISTS customer_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES customer_chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS customer_chat_messages_session_id_idx ON customer_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS customer_chat_messages_created_at_idx ON customer_chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE customer_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_chat_messages
DROP POLICY IF EXISTS "Customers can read own messages" ON customer_chat_messages;
DROP POLICY IF EXISTS "Customers can insert own messages" ON customer_chat_messages;

CREATE POLICY "Customers can read own messages"
ON customer_chat_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM customer_chat_sessions
        WHERE customer_chat_sessions.id = customer_chat_messages.session_id
        AND customer_chat_sessions.customer_id = auth.uid()
    )
);

CREATE POLICY "Customers can insert own messages"
ON customer_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM customer_chat_sessions
        WHERE customer_chat_sessions.id = customer_chat_messages.session_id
        AND customer_chat_sessions.customer_id = auth.uid()
    )
);

-- ============================================
-- 5. notifications table (unified for owners and customers)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('owner', 'customer')),
    recipient_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage notifications" ON notifications;

CREATE POLICY "Users can read own notifications"
ON notifications
FOR SELECT
USING (
    (recipient_type = 'owner' AND recipient_id = auth.uid()) OR
    (recipient_type = 'customer' AND recipient_id = auth.uid())
);

CREATE POLICY "Service role can manage notifications"
ON notifications
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. Update bookings table to link to customer_profiles
-- ============================================
-- Check if customer_id column exists in bookings, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'customer_profile_id'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS bookings_customer_profile_id_idx ON bookings(customer_profile_id);
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE customer_profiles IS 'Customer account profiles linked to Supabase Auth';
COMMENT ON TABLE customer_favorites IS 'Shops favorited by customers';
COMMENT ON TABLE customer_chat_sessions IS 'Chat sessions for customer AI assistant';
COMMENT ON TABLE customer_chat_messages IS 'Messages in customer AI chat sessions';
COMMENT ON TABLE notifications IS 'Unified notifications for owners and customers';


-- ============================================
-- INTERNAL MESSAGING SYSTEM
-- ============================================
-- Replaces LINE chat with internal inbox
-- Supports LINE, Web, and Guest users
-- ============================================

-- ============================================
-- STEP 1: Create customer_type enum
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_type_enum') THEN
        CREATE TYPE customer_type_enum AS ENUM ('line', 'web', 'guest');
        RAISE NOTICE 'Created customer_type_enum';
    ELSE
        RAISE NOTICE 'customer_type_enum already exists';
    END IF;
END $$;

-- ============================================
-- STEP 2: Create sender_type enum
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sender_type_enum') THEN
        CREATE TYPE sender_type_enum AS ENUM ('customer', 'shop');
        RAISE NOTICE 'Created sender_type_enum';
    ELSE
        RAISE NOTICE 'sender_type_enum already exists';
    END IF;
END $$;

-- ============================================
-- STEP 3: Create conversations table
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    customer_type customer_type_enum NOT NULL,
    customer_ref TEXT NOT NULL, -- line_user_id OR user_id OR guest_token
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure one conversation per shop + customer_ref combination
    UNIQUE(shop_id, customer_ref)
);

-- Add missing columns if table exists without them (for existing tables from partial runs)
DO $$
BEGIN
    -- Add booking_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'booking_id'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added booking_id column to conversations';
    END IF;
    
    -- Add customer_type if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'customer_type'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN customer_type customer_type_enum NOT NULL DEFAULT 'web';
        RAISE NOTICE 'Added customer_type column to conversations';
    END IF;
    
    -- Add customer_ref if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'customer_ref'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN customer_ref TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added customer_ref column to conversations';
    END IF;
    
    -- Add last_message_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'last_message_at'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN last_message_at TIMESTAMPTZ;
        RAISE NOTICE 'Added last_message_at column to conversations';
    END IF;
    
    -- Add created_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
        RAISE NOTICE 'Added created_at column to conversations';
    END IF;
END $$;

-- Clean up existing invalid data before adding constraint
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    -- Delete rows with empty or NULL customer_ref (invalid data)
    DELETE FROM conversations 
    WHERE customer_ref IS NULL OR customer_ref = '';
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    IF row_count > 0 THEN
        RAISE NOTICE 'Deleted % rows with invalid customer_ref', row_count;
    END IF;
    
    -- Delete duplicate rows, keeping only the first one
    DELETE FROM conversations c1
    WHERE EXISTS (
        SELECT 1 FROM conversations c2
        WHERE c2.shop_id = c1.shop_id
        AND c2.customer_ref = c1.customer_ref
        AND c2.id < c1.id
    );
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    IF row_count > 0 THEN
        RAISE NOTICE 'Deleted % duplicate rows', row_count;
    END IF;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'conversations_shop_id_customer_ref_key'
    ) THEN
        -- First ensure customer_ref is NOT NULL
        ALTER TABLE conversations 
        ALTER COLUMN customer_ref SET NOT NULL;
        
        -- Then add unique constraint
        ALTER TABLE conversations 
        ADD CONSTRAINT conversations_shop_id_customer_ref_key 
        UNIQUE(shop_id, customer_ref);
        RAISE NOTICE 'Added unique constraint on (shop_id, customer_ref)';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS conversations_shop_id_idx ON conversations(shop_id);

-- Only create booking_id index if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'booking_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS conversations_booking_id_idx 
        ON conversations(booking_id) 
        WHERE booking_id IS NOT NULL;
        RAISE NOTICE 'Created booking_id index';
    END IF;
END $$;

-- Only create customer_ref index if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'customer_ref'
    ) THEN
        CREATE INDEX IF NOT EXISTS conversations_customer_ref_idx 
        ON conversations(customer_ref);
        RAISE NOTICE 'Created customer_ref index';
    END IF;
END $$;

-- Only create last_message_at index if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'last_message_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx 
        ON conversations(last_message_at DESC);
        RAISE NOTICE 'Created last_message_at index';
    END IF;
END $$;

-- ============================================
-- STEP 4: Create messages table
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type sender_type_enum NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_is_read_idx ON messages(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- ============================================
-- STEP 5: Enable RLS
-- ============================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: RLS Policies for conversations
-- ============================================

-- Service role can do everything
DROP POLICY IF EXISTS "Service role can manage conversations" ON conversations;
CREATE POLICY "Service role can manage conversations"
ON conversations
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- STEP 7: RLS Policies for messages
-- ============================================

-- Service role can do everything
DROP POLICY IF EXISTS "Service role can manage messages" ON messages;
CREATE POLICY "Service role can manage messages"
ON messages
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- STEP 8: Function to update last_message_at
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_conversation_last_message_at ON messages;
CREATE TRIGGER trg_update_conversation_last_message_at
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message_at();

-- ============================================
-- STEP 9: Comments
-- ============================================
COMMENT ON TABLE conversations IS 'Internal messaging conversations between customers and shops. Replaces LINE chat.';
COMMENT ON TABLE messages IS 'Messages within conversations. Supports LINE, Web, and Guest users.';
COMMENT ON COLUMN conversations.customer_type IS 'Type of customer: line, web, or guest';
COMMENT ON COLUMN conversations.customer_ref IS 'Reference to customer: line_user_id (for line), user_id (for web), or guest_token (for guest)';
COMMENT ON COLUMN messages.sender_type IS 'Type of sender: customer or shop';


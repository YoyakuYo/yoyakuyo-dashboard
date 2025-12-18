-- ============================================
-- FIX RLS, PARTICIPANTS, AND VERIFIED SHOPS
-- ============================================
-- PART 1: Fix RLS using conversation_participants
-- PART 2: Ensure participants are inserted on conversation creation
-- PART 3: Fix verified/unverified shops logic
-- ============================================

-- ============================================
-- PART 1: FIX CONVERSATION_PARTICIPANTS TABLE
-- ============================================
-- Ensure conversation_participants has proper structure
DO $$
BEGIN
    -- Add user_id column if missing (for web customers)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_participants' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE conversation_participants 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to conversation_participants';
    END IF;
    
    -- Add line_user_id column if missing (for LINE customers)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_participants' 
        AND column_name = 'line_user_id'
    ) THEN
        ALTER TABLE conversation_participants 
        ADD COLUMN line_user_id TEXT;
        RAISE NOTICE 'Added line_user_id column to conversation_participants';
    END IF;
    
    -- Add shop_id column if missing (for shop participants)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_participants' 
        AND column_name = 'shop_id'
    ) THEN
        ALTER TABLE conversation_participants 
        ADD COLUMN shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added shop_id column to conversation_participants';
    END IF;
    
    -- Update participant_type to support line_customer, web_customer, shop
    -- Keep existing values, just ensure constraint allows new types
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%participant_type%'
        AND check_clause LIKE '%line_customer%'
    ) THEN
        -- Constraint already updated
        RAISE NOTICE 'participant_type constraint already supports line_customer';
    ELSE
        -- Drop old constraint and add new one
        ALTER TABLE conversation_participants 
        DROP CONSTRAINT IF EXISTS conversation_participants_participant_type_check;
        
        ALTER TABLE conversation_participants 
        ADD CONSTRAINT conversation_participants_participant_type_check 
        CHECK (participant_type IN ('shop', 'customer', 'line_customer', 'web_customer', 'guest'));
        
        RAISE NOTICE 'Updated participant_type constraint';
    END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx 
ON conversation_participants(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS conversation_participants_line_user_id_idx 
ON conversation_participants(line_user_id) WHERE line_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS conversation_participants_shop_id_idx 
ON conversation_participants(shop_id) WHERE shop_id IS NOT NULL;

-- ============================================
-- PART 2: DROP ALL EXISTING RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Service role can manage conversations" ON conversations;
DROP POLICY IF EXISTS "Customers can read own conversations" ON conversations;
DROP POLICY IF EXISTS "Customers can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Owners can read shop conversations" ON conversations;

DROP POLICY IF EXISTS "Service role can manage messages" ON messages;
DROP POLICY IF EXISTS "Customers can read own messages" ON messages;
DROP POLICY IF EXISTS "Customers can send messages" ON messages;
DROP POLICY IF EXISTS "Owners can read shop messages" ON messages;
DROP POLICY IF EXISTS "Owners can send shop messages" ON messages;
DROP POLICY IF EXISTS "Owners can mark messages as read" ON messages;

DROP POLICY IF EXISTS "Service role can manage conversation_participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can read conversation_participants" ON conversation_participants;

-- ============================================
-- PART 3: CREATE NEW RLS POLICIES USING conversation_participants
-- ============================================

-- Service role can do everything (for backend API)
CREATE POLICY "Service role can manage conversations"
ON conversations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage messages"
ON messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage conversation_participants"
ON conversation_participants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- MESSAGES SELECT - Users can read messages if they are participants
CREATE POLICY "messages_read_by_participants"
ON messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id
        AND (
            (cp.user_id IS NOT NULL AND cp.user_id = auth.uid())
            OR (cp.line_user_id IS NOT NULL AND cp.line_user_id = (auth.jwt() ->> 'sub'))
        )
    )
);

-- MESSAGES INSERT - Users can insert messages if they are participants
CREATE POLICY "messages_insert_by_participants"
ON messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id
        AND (
            (cp.user_id IS NOT NULL AND cp.user_id = auth.uid())
            OR (cp.line_user_id IS NOT NULL AND cp.line_user_id = (auth.jwt() ->> 'sub'))
        )
    )
);

-- CONVERSATIONS SELECT - Users can read conversations if they are participants
CREATE POLICY "conversations_read_by_participants"
ON conversations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = conversations.id
        AND (
            (cp.user_id IS NOT NULL AND cp.user_id = auth.uid())
            OR (cp.line_user_id IS NOT NULL AND cp.line_user_id = (auth.jwt() ->> 'sub'))
        )
    )
);

-- CONVERSATION_PARTICIPANTS SELECT - Users can read their own participant records
CREATE POLICY "conversation_participants_read_by_user"
ON conversation_participants
FOR SELECT
USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR (line_user_id IS NOT NULL AND line_user_id = (auth.jwt() ->> 'sub'))
);

-- ============================================
-- PART 4: CREATE FUNCTION TO AUTO-INSERT PARTICIPANTS
-- ============================================
CREATE OR REPLACE FUNCTION ensure_conversation_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shop_owner_id UUID;
BEGIN
    -- Insert customer participant based on customer_type
    IF NEW.customer_type = 'line' THEN
        INSERT INTO conversation_participants (
            conversation_id,
            participant_type,
            line_user_id,
            participant_ref
        )
        VALUES (
            NEW.id,
            'line_customer',
            NEW.customer_ref,
            NEW.customer_ref
        )
        ON CONFLICT (conversation_id, participant_type, participant_ref) DO NOTHING;
    ELSIF NEW.customer_type = 'web' THEN
        -- For web customers, we need to get user_id from customer_ref
        -- customer_ref should be the user_id (UUID) for web customers
        INSERT INTO conversation_participants (
            conversation_id,
            participant_type,
            user_id,
            participant_ref
        )
        VALUES (
            NEW.id,
            'web_customer',
            NEW.customer_ref::UUID,
            NEW.customer_ref
        )
        ON CONFLICT (conversation_id, participant_type, participant_ref) DO NOTHING;
    ELSIF NEW.customer_type = 'guest' THEN
        INSERT INTO conversation_participants (
            conversation_id,
            participant_type,
            participant_ref
        )
        VALUES (
            NEW.id,
            'guest',
            NEW.customer_ref
        )
        ON CONFLICT (conversation_id, participant_type, participant_ref) DO NOTHING;
    END IF;
    
    -- Insert shop participant (owner)
    SELECT owner_user_id INTO v_shop_owner_id
    FROM shops
    WHERE id = NEW.shop_id;
    
    IF v_shop_owner_id IS NOT NULL THEN
        INSERT INTO conversation_participants (
            conversation_id,
            participant_type,
            shop_id,
            user_id,
            participant_ref
        )
        VALUES (
            NEW.id,
            'shop',
            NEW.shop_id,
            v_shop_owner_id,
            NEW.shop_id::TEXT
        )
        ON CONFLICT (conversation_id, participant_type, participant_ref) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-insert participants
DROP TRIGGER IF EXISTS trg_ensure_conversation_participants ON conversations;
CREATE TRIGGER trg_ensure_conversation_participants
    AFTER INSERT ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION ensure_conversation_participants();

-- ============================================
-- PART 5: BACKFILL EXISTING CONVERSATIONS
-- ============================================
-- Insert participants for existing conversations that don't have them
INSERT INTO conversation_participants (
    conversation_id,
    participant_type,
    user_id,
    line_user_id,
    shop_id,
    participant_ref
)
SELECT DISTINCT
    c.id AS conversation_id,
    CASE 
        WHEN c.customer_type = 'line' THEN 'line_customer'
        WHEN c.customer_type = 'web' THEN 'web_customer'
        WHEN c.customer_type = 'guest' THEN 'guest'
    END AS participant_type,
    CASE 
        WHEN c.customer_type = 'web' THEN c.customer_ref::UUID
        ELSE NULL
    END AS user_id,
    CASE 
        WHEN c.customer_type = 'line' THEN c.customer_ref
        ELSE NULL
    END AS line_user_id,
    NULL AS shop_id,
    c.customer_ref AS participant_ref
FROM conversations c
WHERE NOT EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = c.id
    AND cp.participant_type IN ('line_customer', 'web_customer', 'guest')
)
ON CONFLICT DO NOTHING;

-- Insert shop participants for existing conversations
INSERT INTO conversation_participants (
    conversation_id,
    participant_type,
    shop_id,
    user_id,
    participant_ref
)
SELECT DISTINCT
    c.id AS conversation_id,
    'shop' AS participant_type,
    c.shop_id,
    s.owner_user_id,
    c.shop_id::TEXT AS participant_ref
FROM conversations c
JOIN shops s ON s.id = c.shop_id
WHERE s.owner_user_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = c.id
    AND cp.participant_type = 'shop'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- PART 6: VERIFY SHOPS TABLE STRUCTURE
-- ============================================
DO $$
BEGIN
    -- Ensure is_verified column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' 
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE shops 
        ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_verified column to shops';
    END IF;
    
    -- Ensure verified_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' 
        AND column_name = 'verified_at'
    ) THEN
        ALTER TABLE shops 
        ADD COLUMN verified_at TIMESTAMPTZ;
        RAISE NOTICE 'Added verified_at column to shops';
    END IF;
    
    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_shops_is_verified ON shops(is_verified);
END $$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION ensure_conversation_participants IS 'Automatically inserts conversation_participants when a conversation is created. Ensures RLS policies work correctly.';
COMMENT ON POLICY "messages_read_by_participants" ON messages IS 'Users can read messages if they are participants in the conversation (via conversation_participants table)';
COMMENT ON POLICY "messages_insert_by_participants" ON messages IS 'Users can insert messages if they are participants in the conversation (via conversation_participants table)';
COMMENT ON POLICY "conversations_read_by_participants" ON conversations IS 'Users can read conversations if they are participants (via conversation_participants table)';


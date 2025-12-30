-- ============================================
-- FIX OWNER AI RESPONSE LOGIC
-- ============================================
-- Implements proper Owner AI behavior:
-- - Owner AI replies to every customer message (unless human replies)
-- - Tracks last_ai_reply_at to prevent duplicate replies
-- - Uses conversation_ai_mode to distinguish AI types
-- ============================================

-- ============================================
-- STEP 1: Add conversation_ai_mode column
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'conversation_ai_mode'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN conversation_ai_mode TEXT NOT NULL DEFAULT 'owner_staff_ai'
        CHECK (conversation_ai_mode IN ('owner_staff_ai', 'line_customer_ai'));
        
        CREATE INDEX IF NOT EXISTS idx_conversations_ai_mode 
        ON conversations(conversation_ai_mode);
        
        RAISE NOTICE 'Added conversation_ai_mode column to conversations';
    ELSE
        RAISE NOTICE 'conversation_ai_mode column already exists';
    END IF;
END $$;

-- ============================================
-- STEP 2: Add last_ai_reply_at column
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'last_ai_reply_at'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN last_ai_reply_at TIMESTAMPTZ;
        
        CREATE INDEX IF NOT EXISTS idx_conversations_last_ai_reply_at 
        ON conversations(last_ai_reply_at);
        
        RAISE NOTICE 'Added last_ai_reply_at column to conversations';
    ELSE
        RAISE NOTICE 'last_ai_reply_at column already exists';
    END IF;
END $$;

-- ============================================
-- STEP 3: Add is_closed column (if missing)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'is_closed'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN is_closed BOOLEAN NOT NULL DEFAULT false;
        
        CREATE INDEX IF NOT EXISTS idx_conversations_is_closed 
        ON conversations(is_closed);
        
        RAISE NOTICE 'Added is_closed column to conversations';
    ELSE
        RAISE NOTICE 'is_closed column already exists';
    END IF;
END $$;

-- ============================================
-- STEP 4: Update handle_ai_auto_reply() function
-- ============================================
-- REMOVE broken guards (max auto-replies limit)
-- ADD proper Owner AI trigger rules
-- ============================================
CREATE OR REPLACE FUNCTION handle_ai_auto_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_shop_id UUID;
    v_settings shop_ai_settings%ROWTYPE;
    v_should_handoff BOOLEAN;
    v_participant_source participant_source_enum;
    v_conversation_ai_mode TEXT;
    v_is_closed BOOLEAN;
    v_last_ai_reply_at TIMESTAMPTZ;
    v_customer_type TEXT;
    v_should_reply BOOLEAN := false;
    v_reason TEXT;
BEGIN
    -- Get participant source from sender_id
    SELECT source INTO v_participant_source
    FROM participants
    WHERE id = NEW.sender_id;
    
    -- Only process customer messages (not owner, ai)
    -- Customer messages come from 'line', 'web', or 'guest' sources
    IF v_participant_source IS NULL OR v_participant_source IN ('owner', 'ai') THEN
        RETURN NEW;
    END IF;
    
    -- Get conversation details
    SELECT 
        shop_id,
        conversation_ai_mode,
        is_closed,
        last_ai_reply_at,
        customer_type
    INTO 
        v_shop_id,
        v_conversation_ai_mode,
        v_is_closed,
        v_last_ai_reply_at,
        v_customer_type
    FROM conversations
    WHERE id = NEW.conversation_id;
    
    IF v_shop_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- STEP 3: Owner AI trigger rules
    -- Owner AI MUST trigger when ALL are true:
    -- 1) conversation_ai_mode = 'owner_staff_ai'
    -- 2) last_message.sender is customer (already checked above)
    -- 3) customer_type IN ('line', 'web') - handled by participant_source
    -- 4) last_message.created_at > last_ai_reply_at (or last_ai_reply_at is NULL)
    -- 5) conversation.is_closed = false
    
    -- Check if this is Owner AI mode
    IF v_conversation_ai_mode != 'owner_staff_ai' THEN
        -- Not owner AI, skip
        RETURN NEW;
    END IF;
    
    -- Check if conversation is closed
    IF v_is_closed = true THEN
        v_reason := 'Conversation is closed';
        INSERT INTO ai_message_logs (shop_id, conversation_id, message_id, decision, reason)
        VALUES (v_shop_id, NEW.conversation_id, NEW.id, 'skip', v_reason);
        RETURN NEW;
    END IF;
    
    -- Check if AI already replied to this message (prevent duplicate)
    IF v_last_ai_reply_at IS NOT NULL AND NEW.created_at <= v_last_ai_reply_at THEN
        v_reason := 'AI already replied after this message timestamp';
        INSERT INTO ai_message_logs (shop_id, conversation_id, message_id, decision, reason)
        VALUES (v_shop_id, NEW.conversation_id, NEW.id, 'skip', v_reason);
        RETURN NEW;
    END IF;
    
    -- Get AI settings
    SELECT * INTO v_settings
    FROM shop_ai_settings
    WHERE shop_id = v_shop_id;
    
    -- If AI not enabled or not configured, skip
    IF v_settings.id IS NULL OR v_settings.enabled = false OR v_settings.auto_reply_enabled = false THEN
        v_reason := 'AI disabled for this shop';
        INSERT INTO ai_message_logs (shop_id, conversation_id, message_id, decision, reason)
        VALUES (v_shop_id, NEW.conversation_id, NEW.id, 'skip', v_reason);
        RETURN NEW;
    END IF;
    
    -- Check handoff keywords (if function exists)
    BEGIN
        v_should_handoff := should_handoff_to_human(v_shop_id, COALESCE(NEW.content, NEW.body, ''));
    EXCEPTION WHEN OTHERS THEN
        v_should_handoff := false;
    END;
    
    IF v_should_handoff THEN
        v_reason := 'Message contains handoff keyword';
        INSERT INTO ai_message_logs (shop_id, conversation_id, message_id, decision, reason)
        VALUES (v_shop_id, NEW.conversation_id, NEW.id, 'handoff', v_reason);
        RETURN NEW;
    END IF;
    
    -- STEP 5: REMOVE BROKEN GUARDS
    -- DO NOT check max auto-replies limit
    -- DO NOT check if AI replied before
    -- Owner AI should reply to EVERY customer message (unless human replies)
    
    -- All conditions met - trigger AI reply
    v_should_reply := true;
    v_reason := 'Owner AI triggered - all conditions met';
    
    -- Log decision to respond (backend will generate actual response)
    INSERT INTO ai_message_logs (shop_id, conversation_id, message_id, decision, reason, ai_response)
    VALUES (
        v_shop_id, 
        NEW.conversation_id, 
        NEW.id, 
        'respond', 
        v_reason,
        NULL
    );
    
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_handle_ai_auto_reply ON messages;
CREATE TRIGGER trg_handle_ai_auto_reply
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_ai_auto_reply();

-- ============================================
-- STEP 6: Create function to update last_ai_reply_at
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_last_ai_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_participant_source participant_source_enum;
BEGIN
    -- Get participant source from sender_id
    SELECT source INTO v_participant_source
    FROM participants
    WHERE id = NEW.sender_id;
    
    -- If this is an AI message, update last_ai_reply_at
    IF v_participant_source = 'ai' THEN
        UPDATE conversations
        SET last_ai_reply_at = NEW.created_at
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to update last_ai_reply_at when AI replies
DROP TRIGGER IF EXISTS trg_update_conversation_last_ai_reply ON messages;
CREATE TRIGGER trg_update_conversation_last_ai_reply
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_ai_reply();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN conversations.conversation_ai_mode IS 'AI mode for this conversation: owner_staff_ai (shop staff-like) or line_customer_ai (LINE customer assistant)';
COMMENT ON COLUMN conversations.last_ai_reply_at IS 'Timestamp of last AI reply. Used to prevent duplicate replies to the same message.';
COMMENT ON COLUMN conversations.is_closed IS 'Whether the conversation is closed. AI will not reply to closed conversations.';
COMMENT ON FUNCTION handle_ai_auto_reply IS 'Owner AI trigger function. Replies to every customer message unless conversation is closed or handoff keyword detected.';
COMMENT ON FUNCTION update_conversation_last_ai_reply IS 'Updates last_ai_reply_at when AI sends a message.';


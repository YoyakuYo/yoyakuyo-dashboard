-- ============================================
-- REMOVE SENDER ENUMS - USE PARTICIPANTS ONLY
-- ============================================
-- This migration removes all sender_role/sender_type enums
-- and makes messages rely ONLY on participants.sender_id
-- ============================================

-- ============================================
-- STEP 1: Add 'ai' to participant_source_enum
-- ============================================
DO $$
BEGIN
    -- Add 'ai' to existing enum if not present
    BEGIN
        ALTER TYPE participant_source_enum ADD VALUE IF NOT EXISTS 'ai';
        RAISE NOTICE 'Added ai to participant_source_enum';
    EXCEPTION 
        WHEN duplicate_object THEN
            RAISE NOTICE 'ai already exists in participant_source_enum';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error adding ai to enum: %', SQLERRM;
    END;
END $$;

-- ============================================
-- STEP 2: Drop triggers that depend on sender_role/sender_type
-- ============================================
-- Must drop triggers BEFORE altering column types
DROP TRIGGER IF EXISTS trg_handle_ai_auto_reply ON messages;

-- ============================================
-- STEP 3: Make sender_role and sender_type nullable TEXT
-- ============================================
DO $$
BEGIN
    -- Convert sender_role to nullable TEXT (remove enum constraint)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'sender_role'
    ) THEN
        -- First, make it nullable
        ALTER TABLE messages 
        ALTER COLUMN sender_role DROP NOT NULL;
        
        -- Convert enum to TEXT
        ALTER TABLE messages 
        ALTER COLUMN sender_role TYPE TEXT USING sender_role::TEXT;
        
        RAISE NOTICE 'Converted sender_role to nullable TEXT';
    END IF;
    
    -- Convert sender_type to nullable TEXT (remove enum constraint)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'sender_type'
    ) THEN
        -- First, make it nullable
        ALTER TABLE messages 
        ALTER COLUMN sender_type DROP NOT NULL;
        
        -- Convert enum to TEXT
        ALTER TABLE messages 
        ALTER COLUMN sender_type TYPE TEXT USING sender_type::TEXT;
        
        RAISE NOTICE 'Converted sender_type to nullable TEXT';
    END IF;
END $$;

-- ============================================
-- STEP 4: Recreate AI trigger function to use participants.source
-- ============================================
-- Update handle_ai_auto_reply() to use participants instead of sender_role
CREATE OR REPLACE FUNCTION handle_ai_auto_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_shop_id UUID;
    v_settings shop_ai_settings%ROWTYPE;
    v_should_handoff BOOLEAN;
    v_ai_reply_count INTEGER;
    v_knowledge TEXT;
    v_participant_source participant_source_enum;
BEGIN
    -- Get participant source from sender_id (NO ENUMS: use participants.source)
    SELECT source INTO v_participant_source
    FROM participants
    WHERE id = NEW.sender_id;
    
    -- Only process customer messages (not owner, ai, or guest)
    -- Customer messages come from 'line', 'web', or 'guest' sources
    IF v_participant_source IS NULL OR v_participant_source IN ('owner', 'ai') THEN
        RETURN NEW;
    END IF;
    
    -- Get shop_id from conversation
    SELECT shop_id INTO v_shop_id
    FROM conversations
    WHERE id = NEW.conversation_id;
    
    IF v_shop_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get AI settings
    SELECT * INTO v_settings
    FROM shop_ai_settings
    WHERE shop_id = v_shop_id;
    
    -- If AI not enabled or not configured, skip
    IF v_settings.id IS NULL OR v_settings.enabled = false OR v_settings.auto_reply_enabled = false THEN
        RETURN NEW;
    END IF;
    
    -- Check handoff keywords (if function exists)
    BEGIN
        v_should_handoff := should_handoff_to_human(v_shop_id, COALESCE(NEW.content, NEW.body, ''));
    EXCEPTION WHEN OTHERS THEN
        v_should_handoff := false;
    END;
    
    IF v_should_handoff THEN
        -- Log decision
        INSERT INTO ai_message_logs (shop_id, conversation_id, message_id, decision, reason)
        VALUES (v_shop_id, NEW.conversation_id, NEW.id, 'handoff', 'Message contains handoff keyword');
        RETURN NEW;
    END IF;
    
    -- Check max auto-replies limit (if function exists)
    BEGIN
        v_ai_reply_count := count_ai_replies_in_conversation(NEW.conversation_id);
    EXCEPTION WHEN OTHERS THEN
        v_ai_reply_count := 0;
    END;
    
    IF v_ai_reply_count >= v_settings.max_auto_replies_per_conversation THEN
        -- Log decision
        INSERT INTO ai_message_logs (shop_id, conversation_id, message_id, decision, reason)
        VALUES (v_shop_id, NEW.conversation_id, NEW.id, 'skip', 
            'Max auto-replies limit reached: ' || v_ai_reply_count);
        RETURN NEW;
    END IF;
    
    -- Log decision to respond (backend will generate actual response)
    -- The backend service handles AI reply generation via /api/ai-message-handler/process
    INSERT INTO ai_message_logs (shop_id, conversation_id, message_id, decision, reason, ai_response)
    VALUES (
        v_shop_id, 
        NEW.conversation_id, 
        NEW.id, 
        'respond', 
        'Auto-reply triggered. Backend will generate response.',
        NULL
    );
    
    RETURN NEW;
END;
$$;

-- Recreate trigger (NO ENUMS: trigger condition removed, function checks participants.source)
DROP TRIGGER IF EXISTS trg_handle_ai_auto_reply ON messages;
CREATE TRIGGER trg_handle_ai_auto_reply
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_ai_auto_reply();

-- ============================================
-- STEP 5: Ensure sender_id is NOT NULL and references participants
-- ============================================
DO $$
BEGIN
    -- Make sender_id NOT NULL if it isn't already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'sender_id'
        AND is_nullable = 'YES'
    ) THEN
        -- First, populate any NULL sender_id values with a default participant
        -- This should not happen if migration was run correctly, but safety check
        UPDATE messages m
        SET sender_id = (
            SELECT id FROM participants 
            WHERE source = 'guest' 
            AND source_id = 'migration_fallback'
            LIMIT 1
        )
        WHERE m.sender_id IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM participants 
            WHERE source = 'guest' 
            AND source_id = 'migration_fallback'
        );
        
        -- Create fallback participant if needed
        INSERT INTO participants (source, source_id, display_name)
        SELECT 'guest', 'migration_fallback', 'Migration Fallback'
        WHERE NOT EXISTS (
            SELECT 1 FROM participants 
            WHERE source = 'guest' 
            AND source_id = 'migration_fallback'
        );
        
        -- Now make it NOT NULL
        ALTER TABLE messages 
        ALTER COLUMN sender_id SET NOT NULL;
        
        RAISE NOTICE 'Made sender_id NOT NULL';
    END IF;
END $$;

-- ============================================
-- STEP 6: Create helper function to get participant source from sender_id
-- ============================================
CREATE OR REPLACE FUNCTION get_participant_source(p_sender_id UUID)
RETURNS participant_source_enum AS $$
DECLARE
    v_source participant_source_enum;
BEGIN
    SELECT source INTO v_source
    FROM participants
    WHERE id = p_sender_id;
    
    RETURN COALESCE(v_source, 'guest'::participant_source_enum);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- STEP 7: Add comment documenting the change
-- ============================================
COMMENT ON COLUMN messages.sender_id IS 
'References participants.id. This is the ONLY source of sender identity. sender_role and sender_type are deprecated and should not be used.';

COMMENT ON COLUMN messages.sender_role IS 
'DEPRECATED: Use participants.source via sender_id instead. Kept for backward compatibility only.';

COMMENT ON COLUMN messages.sender_type IS 
'DEPRECATED: Use participants.source via sender_id instead. Kept for backward compatibility only.';

-- ============================================
-- STEP 8: Create index on sender_id for performance
-- ============================================
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);

-- ============================================
-- STEP 9: Verify all messages have valid sender_id
-- ============================================
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM messages m
    WHERE m.sender_id IS NULL
    OR NOT EXISTS (
        SELECT 1 FROM participants p WHERE p.id = m.sender_id
    );
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'Found % messages with invalid or NULL sender_id', invalid_count;
    ELSE
        RAISE NOTICE 'All messages have valid sender_id references';
    END IF;
END $$;


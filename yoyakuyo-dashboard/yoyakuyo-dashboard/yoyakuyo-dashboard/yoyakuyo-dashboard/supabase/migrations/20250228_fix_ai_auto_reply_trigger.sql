-- ============================================
-- FIX AI AUTO-REPLY TRIGGER
-- ============================================
-- The migration 20250225_fix_messaging_and_add_ai.sql overwrote
-- the correct handle_ai_auto_reply() function with an old version
-- that uses sender_role (which no longer exists).
-- 
-- This migration restores the correct function that uses
-- participants.source instead of sender_role.
-- ============================================

-- Drop the old trigger first
DROP TRIGGER IF EXISTS trg_handle_ai_auto_reply ON messages;

-- Recreate the correct handle_ai_auto_reply() function using participants.source
CREATE OR REPLACE FUNCTION handle_ai_auto_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_shop_id UUID;
    v_settings shop_ai_settings%ROWTYPE;
    v_should_handoff BOOLEAN;
    v_ai_reply_count INTEGER;
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
CREATE TRIGGER trg_handle_ai_auto_reply
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_ai_auto_reply();

-- Add comment
COMMENT ON FUNCTION handle_ai_auto_reply IS 'Trigger function that auto-replies to customer messages. Uses participants.source instead of sender_role.';


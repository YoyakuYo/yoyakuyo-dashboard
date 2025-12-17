-- ============================================
-- FIX MESSAGING + ADD AI AUTO-REPLY
-- ============================================
-- PART 1: Fix messaging system
-- PART 2: Add AI data model
-- PART 3: Add AI message handler
-- ============================================

-- ============================================
-- PART 1.1: Add sender_role enum (customer, shop, ai)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sender_role_enum') THEN
        CREATE TYPE sender_role_enum AS ENUM ('customer', 'shop', 'ai');
        RAISE NOTICE 'Created sender_role_enum';
    ELSE
        -- Add 'ai' to existing enum if not present
        BEGIN
            ALTER TYPE sender_role_enum ADD VALUE IF NOT EXISTS 'ai';
            RAISE NOTICE 'Added ai to sender_role_enum';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'ai already exists in sender_role_enum';
        END;
    END IF;
END $$;

-- ============================================
-- PART 1.2: Add conversation_participants table
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    participant_type TEXT NOT NULL CHECK (participant_type IN ('shop', 'customer')),
    participant_ref TEXT NOT NULL, -- shop_id OR customer_ref (line_user_id/user_id/guest_token)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(conversation_id, participant_type, participant_ref)
);

CREATE INDEX IF NOT EXISTS conversation_participants_conversation_id_idx 
ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_participants_participant_ref_idx 
ON conversation_participants(participant_ref);

-- Enable RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage conversation_participants" ON conversation_participants;
CREATE POLICY "Service role can manage conversation_participants"
ON conversation_participants
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- PART 1.3: Update messages table to use sender_role
-- ============================================
-- Add sender_role column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'sender_role'
    ) THEN
        ALTER TABLE messages 
        ADD COLUMN sender_role sender_role_enum;
        
        -- Migrate existing sender_type to sender_role
        UPDATE messages 
        SET sender_role = CASE 
            WHEN sender_type = 'customer' THEN 'customer'::sender_role_enum
            WHEN sender_type = 'shop' THEN 'shop'::sender_role_enum
            ELSE 'customer'::sender_role_enum
        END;
        
        -- Make NOT NULL after migration
        ALTER TABLE messages 
        ALTER COLUMN sender_role SET NOT NULL;
        
        RAISE NOTICE 'Added sender_role column to messages';
    END IF;
END $$;

-- ============================================
-- PART 2: AI DATA MODEL
-- ============================================

-- ============================================
-- PART 2.1: shop_ai_settings table
-- ============================================
CREATE TABLE IF NOT EXISTS shop_ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    handoff_keywords TEXT[], -- Keywords that trigger handoff to human
    auto_reply_enabled BOOLEAN NOT NULL DEFAULT true,
    max_auto_replies_per_conversation INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_ai_settings_shop_id_idx ON shop_ai_settings(shop_id);

-- Enable RLS
ALTER TABLE shop_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage shop_ai_settings" ON shop_ai_settings;
CREATE POLICY "Service role can manage shop_ai_settings"
ON shop_ai_settings
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- PART 2.2: shop_ai_knowledge table
-- ============================================
CREATE TABLE IF NOT EXISTS shop_ai_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    knowledge_type TEXT NOT NULL CHECK (knowledge_type IN ('profile', 'service', 'hours', 'booking_rules', 'other')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_ai_knowledge_shop_id_idx ON shop_ai_knowledge(shop_id);
CREATE INDEX IF NOT EXISTS shop_ai_knowledge_type_idx ON shop_ai_knowledge(shop_id, knowledge_type);

-- Enable RLS
ALTER TABLE shop_ai_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage shop_ai_knowledge" ON shop_ai_knowledge;
CREATE POLICY "Service role can manage shop_ai_knowledge"
ON shop_ai_knowledge
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- PART 2.3: Function to seed shop_ai_knowledge from shop data
-- ============================================
CREATE OR REPLACE FUNCTION seed_shop_ai_knowledge(p_shop_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_shop shops%ROWTYPE;
    v_service services%ROWTYPE;
    v_opening_hours JSONB;
    v_day TEXT;
    v_day_data JSONB;
    v_open_time TEXT;
    v_close_time TEXT;
    v_hours_text TEXT := '';
BEGIN
    -- Get shop profile
    SELECT * INTO v_shop FROM shops WHERE id = p_shop_id;
    
    IF v_shop.id IS NULL THEN
        RAISE EXCEPTION 'Shop not found: %', p_shop_id;
    END IF;
    
    -- Delete existing knowledge for this shop
    DELETE FROM shop_ai_knowledge WHERE shop_id = p_shop_id;
    
    -- Insert shop profile knowledge
    INSERT INTO shop_ai_knowledge (shop_id, knowledge_type, content, metadata)
    VALUES (
        p_shop_id,
        'profile',
        COALESCE(v_shop.name || E'\n', '') ||
        COALESCE(v_shop.description || '', '') ||
        COALESCE('Address: ' || v_shop.address || E'\n', '') ||
        COALESCE('Phone: ' || v_shop.phone || E'\n', '') ||
        COALESCE('Email: ' || v_shop.email || '', ''),
        jsonb_build_object(
            'name', v_shop.name,
            'address', v_shop.address,
            'phone', v_shop.phone,
            'email', v_shop.email
        )
    );
    
    -- Insert services knowledge
    FOR v_service IN SELECT * FROM services WHERE shop_id = p_shop_id
    LOOP
        INSERT INTO shop_ai_knowledge (shop_id, knowledge_type, content, metadata)
        VALUES (
            p_shop_id,
            'service',
            COALESCE(v_service.name || E'\n', '') ||
            COALESCE(v_service.description || '', '') ||
            COALESCE('Duration: ' || v_service.duration_minutes::text || ' minutes' || E'\n', '') ||
            COALESCE('Price: ' || v_service.price::text || ' yen', ''),
            jsonb_build_object(
                'service_id', v_service.id,
                'name', v_service.name,
                'duration_minutes', v_service.duration_minutes,
                'price', v_service.price
            )
        );
    END LOOP;
    
    -- Insert opening hours knowledge (from shops.opening_hours JSONB)
    v_opening_hours := v_shop.opening_hours;
    
    IF v_opening_hours IS NOT NULL THEN
        -- Parse JSONB opening_hours structure: {"monday": {"open": "10:00", "close": "19:00"}, ...}
        FOR v_day IN SELECT unnest(ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
        LOOP
            v_day_data := v_opening_hours->v_day;
            
            IF v_day_data IS NOT NULL AND jsonb_typeof(v_day_data) = 'object' THEN
                v_open_time := v_day_data->>'open';
                v_close_time := v_day_data->>'close';
                
                IF v_open_time IS NOT NULL AND v_close_time IS NOT NULL THEN
                    v_hours_text := v_hours_text || initcap(v_day) || ': ' || v_open_time || ' - ' || v_close_time || E'\n';
                ELSIF v_open_time IS NULL AND v_close_time IS NULL THEN
                    v_hours_text := v_hours_text || initcap(v_day) || ': Closed' || E'\n';
                END IF;
            END IF;
        END LOOP;
        
        -- Insert opening hours knowledge
        IF length(v_hours_text) > 0 THEN
            INSERT INTO shop_ai_knowledge (shop_id, knowledge_type, content, metadata)
            VALUES (
                p_shop_id,
                'hours',
                trim(v_hours_text),
                jsonb_build_object('opening_hours', v_opening_hours)
            );
        END IF;
    ELSE
        -- No opening hours data, insert default message
        INSERT INTO shop_ai_knowledge (shop_id, knowledge_type, content, metadata)
        VALUES (
            p_shop_id,
            'hours',
            'Opening hours: Please contact the shop for hours.',
            jsonb_build_object('opening_hours', 'null'::jsonb)
        );
    END IF;
    
    -- Insert booking rules knowledge
    INSERT INTO shop_ai_knowledge (shop_id, knowledge_type, content, metadata)
    VALUES (
        p_shop_id,
        'booking_rules',
        'Booking rules: Customers can book services through the app. Bookings must be confirmed by the shop.',
        jsonb_build_object('rules', 'standard')
    );
    
    RAISE NOTICE 'Seeded AI knowledge for shop %', p_shop_id;
END;
$$;

-- ============================================
-- PART 3: AI MESSAGE HANDLER
-- ============================================

-- ============================================
-- PART 3.1: AI decision log table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    decision TEXT NOT NULL CHECK (decision IN ('respond', 'handoff', 'skip')),
    reason TEXT,
    ai_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_message_logs_shop_id_idx ON ai_message_logs(shop_id);
CREATE INDEX IF NOT EXISTS ai_message_logs_conversation_id_idx ON ai_message_logs(conversation_id);

-- Enable RLS
ALTER TABLE ai_message_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage ai_message_logs" ON ai_message_logs;
CREATE POLICY "Service role can manage ai_message_logs"
ON ai_message_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- PART 3.2: Function to check if should handoff
-- ============================================
CREATE OR REPLACE FUNCTION should_handoff_to_human(
    p_shop_id UUID,
    p_message_body TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_handoff_keywords TEXT[];
    v_lower_body TEXT;
BEGIN
    -- Get handoff keywords
    SELECT handoff_keywords INTO v_handoff_keywords
    FROM shop_ai_settings
    WHERE shop_id = p_shop_id AND enabled = true;
    
    -- If no keywords, don't handoff
    IF v_handoff_keywords IS NULL OR array_length(v_handoff_keywords, 1) IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if message contains any handoff keyword
    v_lower_body := lower(p_message_body);
    
    FOR i IN 1..array_length(v_handoff_keywords, 1)
    LOOP
        IF v_lower_body LIKE '%' || lower(v_handoff_keywords[i]) || '%' THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$;

-- ============================================
-- PART 3.3: Function to count AI replies in conversation
-- ============================================
CREATE OR REPLACE FUNCTION count_ai_replies_in_conversation(p_conversation_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM messages
    WHERE conversation_id = p_conversation_id
    AND sender_role = 'ai';
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================
-- PART 3.4: Trigger function for AI auto-reply
-- ============================================
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
    v_ai_response TEXT;
    v_decision TEXT;
    v_reason TEXT;
BEGIN
    -- Only process customer messages
    IF NEW.sender_role != 'customer' THEN
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
    
    -- Check handoff keywords
    v_should_handoff := should_handoff_to_human(v_shop_id, NEW.body);
    IF v_should_handoff THEN
        -- Log decision
        INSERT INTO ai_message_logs (shop_id, conversation_id, message_id, decision, reason)
        VALUES (v_shop_id, NEW.conversation_id, NEW.id, 'handoff', 'Message contains handoff keyword');
        RETURN NEW;
    END IF;
    
    -- Check max auto-replies limit
    v_ai_reply_count := count_ai_replies_in_conversation(NEW.conversation_id);
    IF v_ai_reply_count >= v_settings.max_auto_replies_per_conversation THEN
        -- Log decision
        INSERT INTO ai_message_logs (shop_id, conversation_id, message_id, decision, reason)
        VALUES (v_shop_id, NEW.conversation_id, NEW.id, 'skip', 
            'Max auto-replies limit reached: ' || v_ai_reply_count);
        RETURN NEW;
    END IF;
    
    -- Gather shop knowledge
    SELECT string_agg(content, E'\n\n')
    INTO v_knowledge
    FROM shop_ai_knowledge
    WHERE shop_id = v_shop_id
    ORDER BY knowledge_type, created_at;
    
    -- Get recent conversation context (last 5 messages)
    SELECT string_agg(
        CASE 
            WHEN sender_role = 'customer' THEN 'Customer: ' || body
            WHEN sender_role = 'shop' THEN 'Shop: ' || body
            WHEN sender_role = 'ai' THEN 'AI: ' || body
            ELSE body
        END,
        E'\n'
        ORDER BY created_at DESC
    )
    INTO v_reason
    FROM messages
    WHERE conversation_id = NEW.conversation_id
    AND id != NEW.id
    ORDER BY created_at DESC
    LIMIT 5;
    
    -- Generate AI response using OpenAI (via API call from trigger)
    -- Note: PostgreSQL triggers cannot make HTTP calls directly
    -- This will be handled by a backend service that listens to message inserts
    -- For now, log the decision and return (backend will handle AI reply)
    
    -- Log decision to respond (backend will generate actual response)
    INSERT INTO ai_message_logs (shop_id, conversation_id, message_id, decision, reason, ai_response)
    VALUES (
        v_shop_id, 
        NEW.conversation_id, 
        NEW.id, 
        'respond', 
        'Auto-reply triggered. Backend will generate response.',
        NULL
    );
    
    -- Return without inserting message - backend service will handle AI reply
    RETURN NEW;
    
    -- Insert AI reply
    INSERT INTO messages (conversation_id, sender_role, body, is_read)
    VALUES (NEW.conversation_id, 'ai', v_ai_response, false);
    
    -- Log decision
    INSERT INTO ai_message_logs (shop_id, conversation_id, message_id, decision, reason, ai_response)
    VALUES (v_shop_id, NEW.conversation_id, NEW.id, 'respond', 
        'Auto-reply generated', v_ai_response);
    
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_handle_ai_auto_reply ON messages;
CREATE TRIGGER trg_handle_ai_auto_reply
    AFTER INSERT ON messages
    FOR EACH ROW
    WHEN (NEW.sender_role = 'customer')
    EXECUTE FUNCTION handle_ai_auto_reply();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE conversation_participants IS 'Participants in conversations (shop and customer)';
COMMENT ON TABLE shop_ai_settings IS 'AI auto-reply settings per shop';
COMMENT ON TABLE shop_ai_knowledge IS 'Knowledge base for AI auto-replies (shop profile, services, hours, etc.)';
COMMENT ON TABLE ai_message_logs IS 'Log of AI decisions (respond, handoff, skip)';
COMMENT ON FUNCTION seed_shop_ai_knowledge IS 'Seed AI knowledge from shop data (profile, services, hours)';
COMMENT ON FUNCTION should_handoff_to_human IS 'Check if message contains handoff keywords';
COMMENT ON FUNCTION handle_ai_auto_reply IS 'Trigger function that auto-replies to customer messages';


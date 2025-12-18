-- ============================================
-- UNIFIED PARTICIPANTS SYSTEM
-- ============================================
-- Creates a single identity abstraction for all message senders
-- Eliminates FK violations and identity mismatches
-- ============================================

-- ============================================
-- STEP 1: Create participant_source enum
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_source_enum') THEN
        CREATE TYPE participant_source_enum AS ENUM ('line', 'web', 'guest', 'owner');
        RAISE NOTICE 'Created participant_source_enum';
    ELSE
        RAISE NOTICE 'participant_source_enum already exists';
    END IF;
END $$;

-- ============================================
-- STEP 2: Create participants table
-- ============================================
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source participant_source_enum NOT NULL,
    source_id TEXT NOT NULL, -- line_user_id, user_id, guest_session_id, or owner_user_id
    display_name TEXT, -- Optional display name
    metadata JSONB, -- Additional metadata (e.g., LINE profile, customer_id)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure one participant per source + source_id combination
    UNIQUE(source, source_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS participants_source_source_id_idx ON participants(source, source_id);
CREATE INDEX IF NOT EXISTS participants_source_id_idx ON participants(source_id);

-- Enable RLS
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can manage all
DROP POLICY IF EXISTS "Service role can manage participants" ON participants;
CREATE POLICY "Service role can manage participants"
ON participants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policy: Allow reads for authenticated users (backend validates access)
DROP POLICY IF EXISTS "Users can read participants" ON participants;
CREATE POLICY "Users can read participants"
ON participants
FOR SELECT
TO authenticated, anon
USING (true);

-- ============================================
-- STEP 3: Ensure messages table has required columns
-- ============================================
DO $$
BEGIN
    -- Add sender_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'sender_id'
    ) THEN
        ALTER TABLE messages 
        ADD COLUMN sender_id UUID;
        RAISE NOTICE 'Added sender_id column to messages';
    END IF;
    
    -- Ensure content column exists (some schemas use 'body', we need 'content')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'content'
    ) THEN
        -- If body exists, rename it to content
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' 
            AND column_name = 'body'
        ) THEN
            ALTER TABLE messages 
            RENAME COLUMN body TO content;
            RAISE NOTICE 'Renamed body column to content in messages';
        ELSE
            -- Add content column if neither exists
            ALTER TABLE messages 
            ADD COLUMN content TEXT NOT NULL DEFAULT '';
            RAISE NOTICE 'Added content column to messages';
        END IF;
    END IF;
END $$;

-- ============================================
-- STEP 4: Migrate existing messages to use participants
-- ============================================
-- This is a best-effort migration for existing data
-- New messages will use resolveSender() function
-- Handles both 'shop' (sender_role_enum) and 'owner' (sender_role_type) enum values
DO $$
DECLARE
    msg_record RECORD;
    participant_id_val UUID;
    owner_user_id_val UUID;
BEGIN
    -- For messages with sender_role = 'shop' OR 'owner', try to find owner participant
    -- Check which enum type is being used and handle both cases
    -- Cast to TEXT to avoid enum type mismatch errors
    FOR msg_record IN 
        SELECT m.id, m.conversation_id, m.sender_role::TEXT as sender_role_text, c.shop_id
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.sender_id IS NULL
        AND (m.sender_role::TEXT IN ('shop', 'owner'))
    LOOP
        -- Get owner_user_id from shop
        SELECT owner_user_id INTO owner_user_id_val
        FROM shops
        WHERE id = msg_record.shop_id
        LIMIT 1;
        
        IF owner_user_id_val IS NULL THEN
            RAISE NOTICE 'No owner found for shop %, skipping message %', msg_record.shop_id, msg_record.id;
            CONTINUE;
        END IF;
        
        -- Try to find or create owner participant
        SELECT id INTO participant_id_val
        FROM participants
        WHERE source = 'owner'
        AND source_id = owner_user_id_val::TEXT
        LIMIT 1;
        
        -- If not found, create one
        IF participant_id_val IS NULL THEN
            INSERT INTO participants (source, source_id, display_name)
            VALUES ('owner', owner_user_id_val::TEXT, 'Shop Owner')
            RETURNING id INTO participant_id_val;
        END IF;
        
        -- Update message
        UPDATE messages
        SET sender_id = participant_id_val
        WHERE id = msg_record.id;
        
        RAISE NOTICE 'Migrated message % to participant %', msg_record.id, participant_id_val;
    END LOOP;
    
    RAISE NOTICE 'Migrated shop/owner messages to participants';
END $$;

-- ============================================
-- STEP 5: Update messages.sender_id to reference participants
-- ============================================
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Drop existing FK constraint if it exists (might reference users)
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_sender_id_fkey'
    ) THEN
        ALTER TABLE messages 
        DROP CONSTRAINT messages_sender_id_fkey;
        RAISE NOTICE 'Dropped existing sender_id FK constraint';
    END IF;
    
    -- Drop any other FK constraints on sender_id
    FOR constraint_record IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'messages'::regclass 
        AND confrelid IS NOT NULL
        AND conname LIKE '%sender%'
    ) LOOP
        EXECUTE format('ALTER TABLE messages DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
    
    -- Make sender_id NOT NULL (only if column exists and has data)
    -- First, set NULL values to a default participant if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'sender_id'
    ) THEN
        -- Check if there are NULL values
        IF EXISTS (SELECT 1 FROM messages WHERE sender_id IS NULL) THEN
            RAISE NOTICE 'Found NULL sender_id values - these will need to be migrated manually';
        END IF;
        
        -- Make NOT NULL (will fail if NULLs exist, but that's OK - migration handles it)
        BEGIN
            ALTER TABLE messages 
            ALTER COLUMN sender_id SET NOT NULL;
            RAISE NOTICE 'Made sender_id NOT NULL';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not make sender_id NOT NULL (may have NULL values): %', SQLERRM;
        END;
    END IF;
    
    -- Add FK to participants (only if column exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'sender_id'
    ) THEN
        -- Add FK constraint
        BEGIN
            ALTER TABLE messages 
            ADD CONSTRAINT messages_sender_id_fkey 
            FOREIGN KEY (sender_id) 
            REFERENCES participants(id) 
            ON DELETE CASCADE;
            RAISE NOTICE 'Added FK constraint from messages.sender_id to participants.id';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'FK constraint already exists';
        END;
    END IF;
END $$;

-- ============================================
-- STEP 6: Create resolve_sender function
-- ============================================
CREATE OR REPLACE FUNCTION resolve_sender(
    p_source participant_source_enum,
    p_source_id TEXT,
    p_display_name TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_participant_id UUID;
BEGIN
    -- Try to find existing participant
    SELECT id INTO v_participant_id
    FROM participants
    WHERE source = p_source
    AND source_id = p_source_id
    LIMIT 1;
    
    -- If found, update metadata if provided
    IF v_participant_id IS NOT NULL THEN
        IF p_metadata IS NOT NULL OR p_display_name IS NOT NULL THEN
            UPDATE participants
            SET 
                display_name = COALESCE(p_display_name, display_name),
                metadata = COALESCE(p_metadata, metadata),
                updated_at = now()
            WHERE id = v_participant_id;
        END IF;
        RETURN v_participant_id;
    END IF;
    
    -- Create new participant
    INSERT INTO participants (source, source_id, display_name, metadata)
    VALUES (p_source, p_source_id, p_display_name, p_metadata)
    RETURNING id INTO v_participant_id;
    
    RETURN v_participant_id;
END;
$$;

COMMENT ON FUNCTION resolve_sender IS 'Resolves or creates a participant by source and source_id. Returns participant.id for use as messages.sender_id';

COMMENT ON TABLE participants IS 'Unified identity abstraction for all message senders. Eliminates FK violations by providing a single table for LINE, WEB, GUEST, and OWNER identities.';

COMMENT ON COLUMN participants.source IS 'Type of participant: line, web, guest, or owner';
COMMENT ON COLUMN participants.source_id IS 'Unique identifier for the participant in their source system (line_user_id, user_id, guest_session_id, owner_user_id)';
COMMENT ON COLUMN participants.metadata IS 'Additional metadata (e.g., customer_id for LINE users, LINE profile info)';


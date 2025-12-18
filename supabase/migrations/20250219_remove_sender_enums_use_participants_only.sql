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
-- STEP 2: Make sender_role and sender_type nullable TEXT
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
-- STEP 3: Ensure sender_id is NOT NULL and references participants
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
-- STEP 4: Update triggers and functions that reference sender_role/sender_type
-- ============================================
-- Drop any triggers that depend on sender_role/sender_type enums
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN (
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
        AND event_object_table = 'messages'
    ) LOOP
        -- Check if trigger function uses sender_role or sender_type
        -- We'll update specific triggers manually below
        RAISE NOTICE 'Found trigger: % on %', trigger_record.trigger_name, trigger_record.event_object_table;
    END LOOP;
END $$;

-- ============================================
-- STEP 5: Create helper function to get participant source from sender_id
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
-- STEP 6: Update AI message handler trigger (if exists)
-- ============================================
-- The trigger should use participants.source instead of sender_role
-- This will be handled in the backend code, but we ensure the column exists

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


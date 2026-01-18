-- ============================================
-- AI ROLE SYSTEM
-- ============================================
-- Creates database-backed context for AI role separation
-- Ensures AI never confuses guests, web customers, LINE customers, or owners
-- ============================================

-- ============================================
-- STEP 1: Create ai_actor_role enum (AI ONLY)
-- ============================================
-- This enum is used ONLY by AI logic
-- Must NOT be reused by messaging, bookings, or any other system
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_actor_role') THEN
        CREATE TYPE ai_actor_role AS ENUM (
            'guest',
            'web_customer',
            'line_customer',
            'owner'
        );
        RAISE NOTICE 'Created ai_actor_role enum';
    ELSE
        RAISE NOTICE 'ai_actor_role enum already exists';
    END IF;
END $$;

-- ============================================
-- STEP 2: Create ai_sessions table
-- ============================================
-- Defines WHO the AI is acting as for a given session/request
CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    actor_role ai_actor_role NOT NULL,
    actor_id UUID NULL, -- NULL only for guest
    shop_id UUID NULL, -- required for owner, optional for others
    
    channel TEXT NOT NULL CHECK (
        channel IN ('web', 'line', 'dashboard')
    ),
    
    language TEXT NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT ai_sessions_guest_actor_id_null CHECK (
        (actor_role = 'guest' AND actor_id IS NULL) OR
        (actor_role != 'guest' AND actor_id IS NOT NULL)
    ),
    CONSTRAINT ai_sessions_owner_shop_id_required CHECK (
        (actor_role = 'owner' AND shop_id IS NOT NULL) OR
        (actor_role != 'owner')
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ai_sessions_actor_role_idx ON ai_sessions(actor_role);
CREATE INDEX IF NOT EXISTS ai_sessions_actor_id_idx ON ai_sessions(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_sessions_shop_id_idx ON ai_sessions(shop_id) WHERE shop_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_sessions_channel_idx ON ai_sessions(channel);
CREATE INDEX IF NOT EXISTS ai_sessions_created_at_idx ON ai_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can manage all
DROP POLICY IF EXISTS "Service role can manage ai_sessions" ON ai_sessions;
CREATE POLICY "Service role can manage ai_sessions"
ON ai_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policy: Users can view their own sessions
DROP POLICY IF EXISTS "Users can view their own ai_sessions" ON ai_sessions;
CREATE POLICY "Users can view their own ai_sessions"
ON ai_sessions
FOR SELECT
USING (
    (actor_role = 'guest') OR
    (actor_id IS NOT NULL AND actor_id::TEXT = auth.uid()::TEXT)
);

-- ============================================
-- STEP 3: Create ai_interactions table
-- ============================================
-- Internal memory to keep AI grounded and prevent hallucination
-- This is NOT chat history for users
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    actor_role ai_actor_role NOT NULL,
    actor_id UUID NULL,
    shop_id UUID NULL,
    
    user_input TEXT NOT NULL,
    ai_output TEXT NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ai_interactions_actor_role_idx ON ai_interactions(actor_role);
CREATE INDEX IF NOT EXISTS ai_interactions_actor_id_idx ON ai_interactions(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_interactions_shop_id_idx ON ai_interactions(shop_id) WHERE shop_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_interactions_created_at_idx ON ai_interactions(created_at DESC);

-- Enable RLS
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can manage all
DROP POLICY IF EXISTS "Service role can manage ai_interactions" ON ai_interactions;
CREATE POLICY "Service role can manage ai_interactions"
ON ai_interactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policy: Users can view their own interactions
DROP POLICY IF EXISTS "Users can view their own ai_interactions" ON ai_interactions;
CREATE POLICY "Users can view their own ai_interactions"
ON ai_interactions
FOR SELECT
USING (
    (actor_role = 'guest') OR
    (actor_id IS NOT NULL AND actor_id::TEXT = auth.uid()::TEXT)
);

-- ============================================
-- STEP 4: Add comments
-- ============================================
COMMENT ON TYPE ai_actor_role IS 'AI-only enum for actor roles. Must NOT be reused by messaging, bookings, or other systems.';
COMMENT ON TABLE ai_sessions IS 'Defines WHO the AI is acting as for a given session/request. AI must refuse to run if actor_role is missing.';
COMMENT ON COLUMN ai_sessions.actor_role IS 'The role the AI is acting as. Must be one of: guest, web_customer, line_customer, owner.';
COMMENT ON COLUMN ai_sessions.actor_id IS 'The ID of the actor. NULL only for guest. For web_customer: user_id. For line_customer: mapped LINE customer id. For owner: owner user id.';
COMMENT ON COLUMN ai_sessions.shop_id IS 'Shop ID. Required for owner, optional for others.';
COMMENT ON COLUMN ai_sessions.channel IS 'Channel where AI is being used: web, line, or dashboard.';
COMMENT ON TABLE ai_interactions IS 'Internal memory to keep AI grounded and prevent hallucination. NOT chat history for users. Used for debugging and traceability.';
COMMENT ON COLUMN ai_interactions.actor_role IS 'The role the AI was acting as when this interaction occurred.';
COMMENT ON COLUMN ai_interactions.user_input IS 'The user input that triggered this AI interaction.';
COMMENT ON COLUMN ai_interactions.ai_output IS 'The AI output for this interaction.';


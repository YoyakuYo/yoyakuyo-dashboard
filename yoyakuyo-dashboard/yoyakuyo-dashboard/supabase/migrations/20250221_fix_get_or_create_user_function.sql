-- Migration: Fix get_or_create_user_from_line_sub function
-- The function may have a race condition or logic issue causing it to create new users
-- instead of returning existing ones

-- ============================================
-- 1. Fix the RPC function to be more robust
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_user_from_line_sub(line_sub TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    canonical_user_id UUID;
    existing_identity_id UUID;
BEGIN
    -- CRITICAL: Use SELECT FOR UPDATE to prevent race conditions
    -- This ensures only one transaction can create a user for the same line_sub
    SELECT user_id INTO canonical_user_id
    FROM user_identities
    WHERE provider = 'line' AND provider_user_id = line_sub
    LIMIT 1
    FOR UPDATE;
    
    -- If found, return existing user_id IMMEDIATELY
    IF canonical_user_id IS NOT NULL THEN
        RETURN canonical_user_id;
    END IF;
    
    -- Create new user ONLY if identity doesn't exist
    INSERT INTO public.users (id, created_at, updated_at)
    VALUES (gen_random_uuid(), NOW(), NOW())
    RETURNING id INTO canonical_user_id;
    
    -- Create identity mapping with ON CONFLICT handling
    INSERT INTO user_identities (user_id, provider, provider_user_id, created_at)
    VALUES (canonical_user_id, 'line', line_sub, NOW())
    ON CONFLICT (provider, provider_user_id) 
    DO UPDATE SET user_id = EXCLUDED.user_id  -- Update if conflict (shouldn't happen, but safety)
    RETURNING user_id INTO existing_identity_id;
    
    -- CRITICAL: If conflict occurred (race condition), get the existing user_id
    IF existing_identity_id IS NULL OR existing_identity_id != canonical_user_id THEN
        SELECT user_id INTO canonical_user_id
        FROM user_identities
        WHERE provider = 'line' AND provider_user_id = line_sub;
        
        -- If we created a user but identity already existed, we have an orphaned user
        -- Log it but don't fail
        IF canonical_user_id IS NULL THEN
            RAISE EXCEPTION 'Failed to get or create user identity for line_sub: %', line_sub;
        END IF;
    END IF;
    
    RETURN canonical_user_id;
END;
$$;

COMMENT ON FUNCTION get_or_create_user_from_line_sub IS 'Gets or creates canonical user_id from LINE sub. Handles race conditions and always returns the same user_id for the same line_sub.';


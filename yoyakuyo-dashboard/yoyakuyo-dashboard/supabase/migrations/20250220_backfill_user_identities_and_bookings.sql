-- Migration: Backfill user_identities and bookings.user_id from existing LINE data
-- This migration maps existing LINE users to canonical users and updates bookings

-- ============================================
-- 1. Backfill user_identities from customer_profiles with line_user_id
-- ============================================
DO $$
DECLARE
    profile_record RECORD;
    canonical_user_id UUID;
BEGIN
    -- For each customer_profile with line_user_id, create user and identity mapping
    FOR profile_record IN 
        SELECT id, line_user_id, name, email
        FROM customer_profiles
        WHERE line_user_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM user_identities
            WHERE provider = 'line' AND provider_user_id = customer_profiles.line_user_id
        )
    LOOP
        -- Create canonical user
        INSERT INTO public.users (id, name, email, created_at)
        VALUES (gen_random_uuid(), profile_record.name, profile_record.email, NOW())
        RETURNING id INTO canonical_user_id;
        
        -- Create identity mapping
        INSERT INTO user_identities (user_id, provider, provider_user_id)
        VALUES (canonical_user_id, 'line', profile_record.line_user_id)
        ON CONFLICT (provider, provider_user_id) DO NOTHING;
        
        RAISE NOTICE 'Created user mapping: line_user_id=%, user_id=%', profile_record.line_user_id, canonical_user_id;
    END LOOP;
END $$;

-- ============================================
-- 2. Backfill bookings.user_id from customer_profiles
-- ============================================
DO $$
DECLARE
    booking_record RECORD;
    mapped_user_id UUID;
BEGIN
    -- For bookings with customer_profile_id that has line_user_id
    FOR booking_record IN
        SELECT b.id, b.customer_profile_id, cp.line_user_id
        FROM bookings b
        JOIN customer_profiles cp ON cp.id = b.customer_profile_id
        WHERE b.user_id IS NULL
        AND cp.line_user_id IS NOT NULL
    LOOP
        -- Get canonical user_id from identity mapping
        SELECT user_id INTO mapped_user_id
        FROM user_identities
        WHERE provider = 'line' AND provider_user_id = booking_record.line_user_id
        LIMIT 1;
        
        -- Update booking if mapping found
        IF mapped_user_id IS NOT NULL THEN
            UPDATE bookings
            SET user_id = mapped_user_id
            WHERE id = booking_record.id;
            
            RAISE NOTICE 'Updated booking: booking_id=%, user_id=%', booking_record.id, mapped_user_id;
        END IF;
    END LOOP;
    
    -- For bookings with customer_id (legacy web users)
    -- Map customer_id to users.id if customer_id exists in users table
    UPDATE bookings
    SET user_id = customer_id
    WHERE user_id IS NULL
    AND customer_id IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.users WHERE users.id = bookings.customer_id
    );
    
    -- For bookings with customer_profile_id that references auth.users
    -- Map customer_profile_id to users.id if it exists
    UPDATE bookings
    SET user_id = customer_profile_id
    WHERE user_id IS NULL
    AND customer_profile_id IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.users WHERE users.id = bookings.customer_profile_id
    );
END $$;

-- ============================================
-- 3. Create notifications for existing unread bookings
-- ============================================
INSERT INTO shop_notifications (shop_id, booking_id, type, is_read, created_at)
SELECT 
    b.shop_id,
    b.id,
    'new_booking',
    FALSE,
    b.created_at
FROM bookings b
WHERE b.shop_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM shop_notifications
    WHERE booking_id = b.id
)
AND b.status IN ('pending', 'confirmed')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE user_identities IS 'Maps provider identities (LINE, etc.) to canonical users.id - backfilled from existing customer_profiles';


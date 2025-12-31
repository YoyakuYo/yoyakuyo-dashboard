-- Migration: Add push notification subscriptions for customers and owners
-- Enables Web Push notifications for bookings, messages, and reviews

-- ============================================
-- 1. Update customer_push_subscriptions to use customer_profile_id
-- ============================================
DO $$
BEGIN
    -- Add customer_profile_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer_push_subscriptions' 
        AND column_name = 'customer_profile_id'
    ) THEN
        ALTER TABLE customer_push_subscriptions
        ADD COLUMN customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE;
        
        -- Migrate existing data if customer_id exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'customer_push_subscriptions' 
            AND column_name = 'customer_id'
        ) THEN
            -- Try to link existing subscriptions to customer_profiles
            UPDATE customer_push_subscriptions cps
            SET customer_profile_id = cp.id
            FROM customer_profiles cp
            WHERE cp.customer_auth_id = cps.customer_id
            AND cps.customer_profile_id IS NULL;
        END IF;
        
        -- Make customer_profile_id NOT NULL after migration
        -- But allow NULL temporarily for existing records
    END IF;
END $$;

-- Create index for customer_profile_id
CREATE INDEX IF NOT EXISTS customer_push_subscriptions_profile_id_idx 
ON customer_push_subscriptions(customer_profile_id) 
WHERE customer_profile_id IS NOT NULL;

-- ============================================
-- 2. Create owner_push_subscriptions table
-- ============================================
CREATE TABLE IF NOT EXISTS owner_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, endpoint) -- One subscription per owner/endpoint
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS owner_push_subscriptions_owner_id_idx 
ON owner_push_subscriptions(owner_user_id);

-- Enable RLS
ALTER TABLE owner_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for owner_push_subscriptions
CREATE POLICY "Owners can manage their own push subscriptions"
ON owner_push_subscriptions
FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

-- Service role can manage all subscriptions
CREATE POLICY "Service role can manage all owner push subscriptions"
ON owner_push_subscriptions
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comments
COMMENT ON TABLE owner_push_subscriptions IS 'Stores Web Push subscription endpoints for owners to receive notifications';
COMMENT ON TABLE customer_push_subscriptions IS 'Stores Web Push subscription endpoints for customers to receive notifications (updated to use customer_profile_id)';


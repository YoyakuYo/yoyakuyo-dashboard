-- ============================================================================
-- EXTEND SHOPS TABLE WITH VERIFICATION & SUBSCRIPTION FIELDS
-- ============================================================================
-- This migration extends the existing shops table with:
-- 1. Extended verification fields (verification_notes, booking_enabled, ai_enabled)
-- 2. Subscription plan field
-- 3. Business information fields
-- ============================================================================

-- Add missing verification fields if they don't exist
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro'));

-- Update verification_status to include 'not_submitted'
-- First, drop the existing constraint if it exists
DO $$
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'shops' 
        AND constraint_name LIKE '%verification_status%'
    ) THEN
        ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_verification_status_check;
    END IF;
END $$;

-- Add new constraint with 'not_submitted' option
ALTER TABLE shops
DROP CONSTRAINT IF EXISTS shops_verification_status_check,
ADD CONSTRAINT shops_verification_status_check 
    CHECK (verification_status IN ('not_submitted', 'pending', 'approved', 'rejected'));

-- Set default verification_status to 'not_submitted' for shops without owner
UPDATE shops
SET verification_status = 'not_submitted'
WHERE verification_status IS NULL
AND owner_user_id IS NULL;

-- Add business information fields
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS registered_business_name TEXT,
ADD COLUMN IF NOT EXISTS business_registration_number TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN ('individual', 'corporation', 'franchise')),
ADD COLUMN IF NOT EXISTS tax_status TEXT CHECK (tax_status IN ('registered', 'not_registered', 'unknown')),
ADD COLUMN IF NOT EXISTS languages_supported TEXT[],
ADD COLUMN IF NOT EXISTS target_customers TEXT[];

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_shops_booking_enabled ON shops(booking_enabled);
CREATE INDEX IF NOT EXISTS idx_shops_ai_enabled ON shops(ai_enabled);
CREATE INDEX IF NOT EXISTS idx_shops_subscription_plan ON shops(subscription_plan);

-- Add comments
COMMENT ON COLUMN shops.verification_notes IS 'Notes from staff reviewers about verification status';
COMMENT ON COLUMN shops.booking_enabled IS 'Whether online booking is enabled (requires verification + subscription)';
COMMENT ON COLUMN shops.ai_enabled IS 'Whether AI assistant is enabled (requires verification + pro subscription)';
COMMENT ON COLUMN shops.subscription_plan IS 'Subscription plan: free, basic, or pro';
COMMENT ON COLUMN shops.registered_business_name IS 'Official registered business name';
COMMENT ON COLUMN shops.business_registration_number IS 'Business registration/license number';
COMMENT ON COLUMN shops.business_type IS 'Type of business: individual, corporation, or franchise';
COMMENT ON COLUMN shops.tax_status IS 'Tax registration status';
COMMENT ON COLUMN shops.languages_supported IS 'Array of languages supported by the shop';
COMMENT ON COLUMN shops.target_customers IS 'Array of target customer types: men, women, couples, families';


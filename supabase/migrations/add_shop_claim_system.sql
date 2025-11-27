-- Migration: Add shop claim request system
-- This migration creates tables for shop owners to claim shops with document verification

-- Step 1: Create shop_claim_requests table
CREATE TABLE IF NOT EXISTS shop_claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claimant_name text NOT NULL,
  claimant_email text NOT NULL,
  claimant_phone text,
  claimant_website text,
  -- For matching purposes (store at time of claim):
  shop_name_at_time text NOT NULL,
  shop_address_at_time text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 2: Create shop_claim_files table for uploaded documents
CREATE TABLE IF NOT EXISTS shop_claim_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES shop_claim_requests(id) ON DELETE CASCADE,
  file_path text NOT NULL, -- Path in Supabase storage: shop-claims/{claim_id}/{filename}
  file_name text NOT NULL, -- Original filename
  file_size bigint, -- File size in bytes
  file_type text, -- MIME type (e.g., image/jpeg, application/pdf)
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_claim_requests_shop_id ON shop_claim_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_owner_user_id ON shop_claim_requests(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON shop_claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_claim_requests_created_at ON shop_claim_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claim_files_claim_id ON shop_claim_files(claim_id);

-- Step 4: Add verification_status column to shops table if it doesn't exist
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified'; -- unverified | verified | rejected

-- Step 5: Add claimed_at column to shops table if it doesn't exist
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

-- Step 6: Add comments for documentation
COMMENT ON TABLE shop_claim_requests IS 'Stores shop claim requests from owners with document verification';
COMMENT ON TABLE shop_claim_files IS 'Stores file references for claim request documents';
COMMENT ON COLUMN shop_claim_requests.shop_name_at_time IS 'Shop name at the time of claim request (for matching verification)';
COMMENT ON COLUMN shop_claim_requests.shop_address_at_time IS 'Shop address at the time of claim request (for matching verification)';
COMMENT ON COLUMN shop_claim_requests.status IS 'Claim status: pending (awaiting review), approved (shop assigned to owner), rejected (claim denied)';
COMMENT ON COLUMN shops.verification_status IS 'Shop verification status: unverified (default), verified (approved claim), rejected (claim denied)';


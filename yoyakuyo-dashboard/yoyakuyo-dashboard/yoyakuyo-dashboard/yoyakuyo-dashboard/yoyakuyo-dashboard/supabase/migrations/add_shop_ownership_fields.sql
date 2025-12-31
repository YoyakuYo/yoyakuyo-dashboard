-- Migration: Add shop ownership and claim fields
-- Run this migration to enable shop ownership and claim functionality

-- Add new columns to shops table
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed', 'pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Create index on owner_user_id for faster lookups
CREATE INDEX IF NOT EXISTS shops_owner_user_id_idx ON shops(owner_user_id);

-- Create index on claim_status for filtering
CREATE INDEX IF NOT EXISTS shops_claim_status_idx ON shops(claim_status);

-- Optional: Set default claim_status for existing shops that don't have one
UPDATE shops
SET claim_status = 'unclaimed'
WHERE claim_status IS NULL;

-- Optional: If you want to backfill owner_user_id for shops created by a specific user
-- (Replace 'YOUR_USER_ID_HERE' with the actual user ID)
-- UPDATE shops
-- SET owner_user_id = 'YOUR_USER_ID_HERE',
--     claim_status = 'approved',
--     claimed_at = NOW()
-- WHERE owner_user_id IS NULL
--   AND id IN (
--     -- Add shop IDs here that you want to assign to this user
--     SELECT id FROM shops WHERE name = 'Your Shop Name'
--   );


-- Fix KEGNECO shop (already verified by admin) - set status to match reality
-- Run in Supabase Dashboard → SQL Editor

UPDATE shops
SET
  shop_status = 'claimed',
  verification_status = 'approved',
  claim_status = 'approved',
  is_verified = true,
  verified_at = COALESCE(verified_at, NOW())
WHERE id = '8d3a1ee8-4dfc-4289-bcbb-9611c20bfa86'
  AND verification_status != 'approved';

-- Verify (optional - run after the update)
SELECT id, name, shop_status, verification_status, claim_status, is_verified
FROM shops
WHERE id = '8d3a1ee8-4dfc-4289-bcbb-9611c20bfa86';

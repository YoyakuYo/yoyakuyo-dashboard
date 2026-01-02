-- Migration: Move shops without addresses to backup table
-- This will move ~50,422 shops (58.40% of total shops) to shops_backup_no_address table
-- This is a SAFE operation - shops are moved, not deleted, so they can be restored if needed.

-- Step 1: Create backup table with same structure as shops
CREATE TABLE IF NOT EXISTS shops_backup_no_address (
  LIKE shops INCLUDING ALL
);

-- Step 2: Add backup metadata columns
ALTER TABLE shops_backup_no_address 
ADD COLUMN IF NOT EXISTS backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS backup_reason TEXT DEFAULT 'No address data';

-- Step 3: Count shops that will be moved (for verification)
DO $$
DECLARE
  shops_to_move_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO shops_to_move_count
  FROM shops
  WHERE address IS NULL 
    OR address = ''
    OR TRIM(address) = '';
  
  RAISE NOTICE 'Shops to be moved to backup: %', shops_to_move_count;
END $$;

-- Step 4: Move shops without addresses to backup table
-- The backup table has all shops columns (from LIKE shops INCLUDING ALL) plus backed_up_at and backup_reason
INSERT INTO shops_backup_no_address
SELECT 
  *,
  NOW() as backed_up_at,
  'No address data' as backup_reason
FROM shops
WHERE address IS NULL 
  OR address = ''
  OR TRIM(address) = '';

-- Step 5: Delete shops without addresses from main table
-- (They are now safely stored in the backup table)
DELETE FROM shops
WHERE address IS NULL 
  OR address = ''
  OR TRIM(address) = '';

-- Step 6: Verify migration
DO $$
DECLARE
  shops_in_backup INTEGER;
  remaining_shops_without_address INTEGER;
  total_shops_remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO shops_in_backup
  FROM shops_backup_no_address;
  
  SELECT COUNT(*) INTO remaining_shops_without_address
  FROM shops
  WHERE address IS NULL 
    OR address = ''
    OR TRIM(address) = '';
  
  SELECT COUNT(*) INTO total_shops_remaining
  FROM shops;
  
  RAISE NOTICE 'Shops moved to backup table: %', shops_in_backup;
  RAISE NOTICE 'Remaining shops without addresses in main table: %', remaining_shops_without_address;
  RAISE NOTICE 'Total shops remaining in main table: %', total_shops_remaining;
  
  IF remaining_shops_without_address > 0 THEN
    RAISE WARNING 'Some shops without addresses still exist in main table. Please check.';
  END IF;
END $$;

-- Step 7: Add comments for documentation
COMMENT ON TABLE shops_backup_no_address IS 'Backup table for shops without addresses. Created in migration 20260103000006. These shops can be restored if needed.';
COMMENT ON TABLE shops IS 'Shops table - all shops should have valid addresses. Shops without addresses were moved to shops_backup_no_address in migration 20260103000006.';


-- SQL Script to Delete All Staff Dashboard Data
-- This will remove all staff profiles, complaints, and related data
-- WARNING: This is irreversible! Make sure you want to delete all staff data.

-- ============================================
-- 1. Delete complaint messages first (has foreign key to complaints)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'complaint_messages') THEN
        DELETE FROM complaint_messages;
        RAISE NOTICE 'Deleted all complaint_messages';
    ELSE
        RAISE NOTICE 'Table complaint_messages does not exist, skipping';
    END IF;
END $$;

-- ============================================
-- 2. Delete complaints (has foreign key to staff_profiles)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'complaints') THEN
        DELETE FROM complaints;
        RAISE NOTICE 'Deleted all complaints';
    ELSE
        RAISE NOTICE 'Table complaints does not exist, skipping';
    END IF;
END $$;

-- ============================================
-- 3. Clear staff-related fields in shops table
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'staff_notes'
    ) THEN
        UPDATE shops 
        SET staff_notes = NULL,
            last_staff_edit_by = NULL,
            last_staff_edit_at = NULL
        WHERE staff_notes IS NOT NULL 
           OR last_staff_edit_by IS NOT NULL 
           OR last_staff_edit_at IS NOT NULL;
        RAISE NOTICE 'Cleared staff-related fields in shops table';
    ELSE
        RAISE NOTICE 'Staff-related columns do not exist in shops table, skipping';
    END IF;
END $$;

-- ============================================
-- 4. Clear staff_id from conversations table (if exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'staff_id'
    ) THEN
        UPDATE conversations SET staff_id = NULL WHERE staff_id IS NOT NULL;
        RAISE NOTICE 'Cleared staff_id from conversations table';
    ELSE
        RAISE NOTICE 'staff_id column does not exist in conversations table, skipping';
    END IF;
END $$;

-- ============================================
-- 5. Clear reviewed_by_staff_id from shop_verification_requests (if exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shop_verification_requests' AND column_name = 'reviewed_by_staff_id'
    ) THEN
        UPDATE shop_verification_requests SET reviewed_by_staff_id = NULL WHERE reviewed_by_staff_id IS NOT NULL;
        RAISE NOTICE 'Cleared reviewed_by_staff_id from shop_verification_requests table';
    ELSE
        RAISE NOTICE 'reviewed_by_staff_id column does not exist in shop_verification_requests table, skipping';
    END IF;
END $$;

-- ============================================
-- 6. Clear staff_id from owner_verification_requests (if exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'owner_verification_requests' AND column_name = 'staff_id'
    ) THEN
        UPDATE owner_verification_requests SET staff_id = NULL WHERE staff_id IS NOT NULL;
        RAISE NOTICE 'Cleared staff_id from owner_verification_requests table';
    ELSE
        RAISE NOTICE 'staff_id column does not exist in owner_verification_requests table, skipping';
    END IF;
END $$;

-- ============================================
-- 7. Delete all staff profiles
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_profiles') THEN
        DELETE FROM staff_profiles;
        RAISE NOTICE 'Deleted all staff_profiles';
    ELSE
        RAISE NOTICE 'Table staff_profiles does not exist, skipping';
    END IF;
END $$;

-- ============================================
-- 8. Verify deletion (optional - shows what was deleted)
-- ============================================
-- Uncomment these to verify:
-- SELECT COUNT(*) as remaining_staff_profiles FROM staff_profiles;
-- SELECT COUNT(*) as remaining_complaints FROM complaints;
-- SELECT COUNT(*) as remaining_complaint_messages FROM complaint_messages;

-- ============================================
-- Note: This script does NOT delete:
-- - The staff_profiles table structure (table remains, just empty)
-- - The complaints table structure (table remains, just empty)
-- - The complaint_messages table structure (table remains, just empty)
-- - Any auth.users records (staff authentication accounts remain)
-- 
-- If you also want to delete the table structures, you would need to:
-- DROP TABLE IF EXISTS complaint_messages CASCADE;
-- DROP TABLE IF EXISTS complaints CASCADE;
-- DROP TABLE IF EXISTS staff_profiles CASCADE;
-- 
-- And remove staff-related columns from shops:
-- ALTER TABLE shops DROP COLUMN IF EXISTS staff_notes;
-- ALTER TABLE shops DROP COLUMN IF EXISTS last_staff_edit_by;
-- ALTER TABLE shops DROP COLUMN IF EXISTS last_staff_edit_at;
-- ============================================


-- ============================================================
-- FINAL FIX: Database Constraints for Account Creation & Shop Claiming
-- ============================================================
-- This file contains ONLY REQUIRED fixes for blocking issues
-- Production-safe, no data loss, no experimental changes
-- ============================================================

-- ============================================================
-- FIX #1: owner_auth_id Foreign Key Constraint
-- ============================================================
-- Issue: FK references owners(id), but code sets it to auth.users.id
-- Solution: Drop FK constraint (owner_auth_id is optional reference field)
-- ============================================================

DO $$
BEGIN
    -- Drop FK if it exists and references owners table
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'users'
            AND kcu.column_name = 'owner_auth_id'
            AND ccu.table_name = 'owners'
    ) THEN
        ALTER TABLE public.users
        DROP CONSTRAINT IF EXISTS users_owner_auth_id_fkey;
        
        RAISE NOTICE '✅ Dropped FK constraint: users_owner_auth_id_fkey (was referencing owners.id)';
    ELSE
        RAISE NOTICE 'ℹ️ No FK constraint found on users.owner_auth_id → owners.id';
    END IF;
END $$;

-- Make owner_auth_id nullable if it's NOT NULL (allows NULL for customers)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'owner_auth_id'
          AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.users
        ALTER COLUMN owner_auth_id DROP NOT NULL;
        
        RAISE NOTICE '✅ Made owner_auth_id nullable';
    ELSE
        RAISE NOTICE 'ℹ️ owner_auth_id is already nullable';
    END IF;
END $$;

-- ============================================================
-- FIX #2: Shop Creation - Check for Required Columns
-- ============================================================
-- Issue: Shop insert may be missing required columns
-- Solution: Verify shop table structure and add defaults if needed
-- ============================================================

-- Check shops table columns
DO $$
DECLARE
    has_owner_id BOOLEAN;
    has_claimed_at BOOLEAN;
    has_claim_status BOOLEAN;
    has_verification_status BOOLEAN;
BEGIN
    -- Check if columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'owner_id'
    ) INTO has_owner_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'claimed_at'
    ) INTO has_claimed_at;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'claim_status'
    ) INTO has_claim_status;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'verification_status'
    ) INTO has_verification_status;
    
    -- Log findings
    RAISE NOTICE 'Shop table columns:';
    RAISE NOTICE '  - owner_id: %', CASE WHEN has_owner_id THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '  - claimed_at: %', CASE WHEN has_claimed_at THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '  - claim_status: %', CASE WHEN has_claim_status THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '  - verification_status: %', CASE WHEN has_verification_status THEN 'EXISTS' ELSE 'MISSING' END;
    
    -- Note: We do NOT create columns here - only report
    -- Column creation should be done via proper migrations if needed
END $$;

-- ============================================================
-- VERIFICATION: Check for CHECK constraints on shops
-- ============================================================
-- This will help identify if any CHECK constraints are blocking inserts
-- ============================================================

DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    RAISE NOTICE 'Checking CHECK constraints on shops table...';
    
    FOR constraint_rec IN
        SELECT 
            conname,
            pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE contype = 'c'
          AND conrelid = 'public.shops'::regclass
    LOOP
        RAISE NOTICE 'Found CHECK constraint: %', constraint_rec.conname;
        RAISE NOTICE '  Definition: %', constraint_rec.definition;
    END LOOP;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No CHECK constraints found on shops table';
    END IF;
END $$;

-- ============================================================
-- SUMMARY
-- ============================================================
-- This migration:
-- 1. Drops FK constraint on owner_auth_id (if it references owners.id)
-- 2. Makes owner_auth_id nullable (if it's NOT NULL)
-- 3. Reports shop table structure (for API fix reference)
-- 4. Reports CHECK constraints on shops (for API fix reference)
--
-- CRITICAL FINDING:
-- Shops table has CHECK constraint: claim_status must be set when owner_user_id is set
-- If owner_user_id is NOT NULL, claim_status cannot be 'unclaimed'
-- Default claim_status is 'unclaimed', so API must set it to 'pending' when creating shop with owner
--
-- Next steps:
-- 1. Update API route to handle nullable owner_auth_id
-- 2. Update shop insert to set claim_status = 'pending' when owner_user_id is set
-- ============================================================


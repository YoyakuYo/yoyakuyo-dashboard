-- ============================================================
-- FIX: owner_auth_id Foreign Key Constraint
-- ============================================================
-- Issue: owner_auth_id FK references owners(id), but code sets it to auth.users.id
-- Solution: Drop FK constraint OR update to reference auth.users.id
-- ============================================================

-- Step 1: Check current FK constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'users'
    AND kcu.column_name = 'owner_auth_id';

-- Step 2: Check if owner_auth_id values exist in owners table
SELECT 
    u.id,
    u.owner_auth_id,
    CASE 
        WHEN u.owner_auth_id IS NULL THEN 'NULL (expected for customers)'
        WHEN EXISTS (SELECT 1 FROM owners WHERE id = u.owner_auth_id) THEN '✅ EXISTS in owners table'
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = u.owner_auth_id) THEN '⚠️ EXISTS in auth.users (FK mismatch)'
        ELSE '❌ NOT FOUND in owners or auth.users'
    END AS fk_status
FROM public.users u
WHERE u.owner_auth_id IS NOT NULL
LIMIT 10;

-- Step 3: Drop existing FK constraint (if it references owners table)
-- ONLY RUN THIS IF FK references owners(id) and we want to change it
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
        
        RAISE NOTICE 'Dropped FK constraint: users_owner_auth_id_fkey';
    ELSE
        RAISE NOTICE 'No FK constraint found on users.owner_auth_id → owners.id';
    END IF;
END $$;

-- Step 4: Create new FK to auth.users (if needed)
-- ONLY RUN THIS IF we want owner_auth_id to reference auth.users.id
-- DO $$
-- BEGIN
--     IF NOT EXISTS (
--         SELECT 1 
--         FROM information_schema.table_constraints tc
--         JOIN information_schema.key_column_usage kcu 
--             ON tc.constraint_name = kcu.constraint_name
--         JOIN information_schema.constraint_column_usage ccu 
--             ON tc.constraint_name = ccu.constraint_name
--         WHERE tc.constraint_type = 'FOREIGN KEY'
--             AND tc.table_name = 'users'
--             AND kcu.column_name = 'owner_auth_id'
--             AND ccu.table_name = 'users'
--             AND ccu.table_schema = 'auth'
--     ) THEN
--         ALTER TABLE public.users
--         ADD CONSTRAINT users_owner_auth_id_fkey
--         FOREIGN KEY (owner_auth_id) 
--         REFERENCES auth.users(id) 
--         ON DELETE SET NULL;
--         
--         RAISE NOTICE 'Created FK constraint: users_owner_auth_id_fkey → auth.users.id';
--     ELSE
--         RAISE NOTICE 'FK constraint already exists: users_owner_auth_id_fkey → auth.users.id';
--     END IF;
-- END $$;

-- Step 5: Alternative - Make owner_auth_id nullable and remove FK entirely
-- Use this if owner_auth_id is optional and doesn't need FK constraint
-- ALTER TABLE public.users
-- ALTER COLUMN owner_auth_id DROP NOT NULL; -- If it's NOT NULL

-- ============================================================
-- RECOMMENDATION:
-- ============================================================
-- Based on the code analysis:
-- 1. Code sets owner_auth_id = user_id (from auth.users.id)
-- 2. FK currently references owners(id) (from migration)
-- 3. This causes FK violation
--
-- OPTION A: Drop FK constraint (if owner_auth_id doesn't need FK)
-- OPTION B: Change FK to reference auth.users.id
-- OPTION C: Update code to use owners.id instead of auth.users.id
--
-- RECOMMENDED: Option A (drop FK) since owner_auth_id seems to be
-- a reference field that may not need strict FK enforcement
-- ============================================================


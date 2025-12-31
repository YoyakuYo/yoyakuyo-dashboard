-- ============================================================================
-- FIX VERIFICATION DOCUMENTS STORAGE POLICY
-- ============================================================================
-- IMPORTANT: Storage policies must be created via Supabase Dashboard or
-- with service role permissions. This migration provides the SQL to run
-- manually in Supabase Dashboard → SQL Editor.
-- ============================================================================
-- 
-- TO APPLY THESE POLICIES:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste the policies below (starting from line 20)
-- 3. Run the SQL
-- ============================================================================

-- ============================================================================
-- MANUAL STEPS (Run in Supabase Dashboard → SQL Editor):
-- ============================================================================

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Owners can read their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can read all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete all verification documents" ON storage.objects;

-- Step 2: Create new policies

-- Owners can read their own verification documents
-- File path structure: user_id/verification_id/filename
CREATE POLICY "Owners can read their verification documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'verification-documents'
        AND auth.role() = 'authenticated'
        AND (
            -- First folder must be user's ID
            (storage.foldername(name))[1] = auth.uid()::text
            OR EXISTS (
                -- Or check if verification belongs to user
                SELECT 1 FROM owner_verification ov
                WHERE ov.user_id = auth.uid()
                AND ov.id::text = (storage.foldername(name))[2]
            )
        )
    );

-- Owners can upload verification documents
-- File path structure: user_id/verification_id/filename
CREATE POLICY "Owners can upload verification documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'verification-documents'
        AND auth.role() = 'authenticated'
        AND (
            -- First folder must be user's ID
            (storage.foldername(name))[1] = auth.uid()::text
            OR EXISTS (
                -- Or check if verification belongs to user
                SELECT 1 FROM owner_verification ov
                WHERE ov.user_id = auth.uid()
                AND ov.id::text = (storage.foldername(name))[2]
            )
        )
    );

-- Owners can update their verification documents
CREATE POLICY "Owners can update their verification documents"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'verification-documents'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'verification-documents'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Owners can delete their verification documents
CREATE POLICY "Owners can delete their verification documents"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'verification-documents'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Staff can read all verification documents
CREATE POLICY "Staff can read all verification documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'verification-documents'
        AND EXISTS (
            SELECT 1 FROM staff_profiles
            WHERE auth_user_id = auth.uid()
            AND active = TRUE
        )
    );

-- Staff can update all verification documents
CREATE POLICY "Staff can update all verification documents"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'verification-documents'
        AND EXISTS (
            SELECT 1 FROM staff_profiles
            WHERE auth_user_id = auth.uid()
            AND active = TRUE
        )
    )
    WITH CHECK (
        bucket_id = 'verification-documents'
        AND EXISTS (
            SELECT 1 FROM staff_profiles
            WHERE auth_user_id = auth.uid()
            AND active = TRUE
        )
    );

-- Staff can delete all verification documents
CREATE POLICY "Staff can delete all verification documents"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'verification-documents'
        AND EXISTS (
            SELECT 1 FROM staff_profiles
            WHERE auth_user_id = auth.uid()
            AND active = TRUE
        )
    );

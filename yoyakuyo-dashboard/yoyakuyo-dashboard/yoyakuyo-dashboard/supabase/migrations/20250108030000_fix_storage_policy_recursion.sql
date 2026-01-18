-- ============================================================================
-- FIX STORAGE POLICY RECURSION ISSUE
-- ============================================================================
-- The previous policy caused infinite recursion when checking staff_profiles.
-- This version avoids recursion by using a simpler approach.
-- ============================================================================
-- 
-- TO APPLY: Run this SQL in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Owners can read their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can read all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete all verification documents" ON storage.objects;

-- ============================================================================
-- SIMPLIFIED POLICIES (No recursion)
-- ============================================================================

-- Owners can read their own verification documents
-- File path structure: user_id/verification_id/filename
-- Only checks if first folder matches user's auth.uid()
CREATE POLICY "Owners can read their verification documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'verification-documents'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Owners can upload verification documents
-- File path structure: user_id/verification_id/filename
-- Only checks if first folder matches user's auth.uid()
CREATE POLICY "Owners can upload verification documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'verification-documents'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
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
-- Use SECURITY DEFINER function to avoid RLS recursion
CREATE OR REPLACE FUNCTION is_staff_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM staff_profiles
        WHERE auth_user_id = user_id
        AND active = TRUE
    );
END;
$$;

CREATE POLICY "Staff can read all verification documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'verification-documents'
        AND is_staff_user(auth.uid())
    );

-- Staff can update all verification documents
CREATE POLICY "Staff can update all verification documents"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'verification-documents'
        AND is_staff_user(auth.uid())
    )
    WITH CHECK (
        bucket_id = 'verification-documents'
        AND is_staff_user(auth.uid())
    );

-- Staff can delete all verification documents
CREATE POLICY "Staff can delete all verification documents"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'verification-documents'
        AND is_staff_user(auth.uid())
    );

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_staff_user(UUID) TO authenticated;

COMMENT ON FUNCTION is_staff_user(UUID) IS 
    'Checks if a user is staff. Uses SECURITY DEFINER to avoid RLS recursion.';


-- ============================================================================
-- FIX VERIFICATION DOCUMENTS STORAGE POLICY
-- ============================================================================
-- Update RLS policies to allow files under user_id/verification_id structure
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Owners can read their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their verification documents" ON storage.objects;

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
DROP POLICY IF EXISTS "Staff can read all verification documents" ON storage.objects;
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
DROP POLICY IF EXISTS "Staff can update all verification documents" ON storage.objects;
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
DROP POLICY IF EXISTS "Staff can delete all verification documents" ON storage.objects;
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

COMMENT ON POLICY "Owners can read their verification documents" ON storage.objects IS 
    'Allows owners to read their own verification documents. File path: user_id/verification_id/filename';
COMMENT ON POLICY "Owners can upload verification documents" ON storage.objects IS 
    'Allows owners to upload verification documents. File path: user_id/verification_id/filename';


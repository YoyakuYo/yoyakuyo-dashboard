-- ============================================================================
-- CREATE STORAGE POLICIES FOR VERIFICATION DOCUMENTS BUCKET
-- ============================================================================
-- This migration creates ONLY the storage policies for the verification-documents bucket
-- 
-- IMPORTANT: 
-- 1. The bucket must be created manually in Supabase Dashboard first
-- 2. This migration does NOT touch the storage.buckets table (no permission issues)
-- 3. This only creates policies on storage.objects
-- ============================================================================

-- Owners can read their own verification documents
DROP POLICY IF EXISTS "Owners can read their verification documents" ON storage.objects;
CREATE POLICY "Owners can read their verification documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'verification-documents'
        AND auth.role() = 'authenticated'
        AND (
            -- Check if file belongs to user's shop verification request
            (storage.foldername(name))[1] = auth.uid()::text
            OR EXISTS (
                SELECT 1 FROM shop_verification_requests svr
                JOIN shops s ON s.id = svr.shop_id
                WHERE s.owner_user_id = auth.uid()
                AND svr.id::text = (storage.foldername(name))[2]
            )
        )
    );

-- Owners can upload verification documents
DROP POLICY IF EXISTS "Owners can upload verification documents" ON storage.objects;
CREATE POLICY "Owners can upload verification documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
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


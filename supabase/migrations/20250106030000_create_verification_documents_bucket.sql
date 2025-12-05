-- ============================================================================
-- CREATE VERIFICATION DOCUMENTS STORAGE POLICIES
-- ============================================================================
-- This migration creates the storage policies for the verification-documents bucket
-- 
-- IMPORTANT: The bucket itself must be created manually first!
-- 
-- To create the bucket:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: "verification-documents"
-- 4. Public: false (unchecked)
-- 5. File size limit: 10MB
-- 6. Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, application/pdf
-- 7. Click "Create bucket"
-- 
-- Then run this migration to create the policies.
-- ============================================================================

-- Verify bucket exists before creating policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'verification-documents'
    ) THEN
        RAISE EXCEPTION 'Storage bucket "verification-documents" does not exist. Please create it first in Supabase Dashboard → Storage → New Bucket';
    END IF;
END $$;

-- ============================================================================
-- STORAGE POLICIES
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

-- Add comments
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';
COMMENT ON COLUMN storage.buckets.id IS 'Bucket identifier';
COMMENT ON COLUMN storage.buckets.name IS 'Bucket display name';
COMMENT ON COLUMN storage.buckets.public IS 'Whether bucket is publicly accessible';


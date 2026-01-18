-- ============================================================================
-- CREATE VERIFICATION DOCUMENTS BUCKET VIA SQL (SERVICE ROLE REQUIRED)
-- ============================================================================
-- This migration creates the storage bucket using SQL
-- 
-- IMPORTANT: This requires SERVICE ROLE permissions to run.
-- If you get "must be owner of table buckets" error, use one of these options:
--
-- Option 1: Run via Supabase Dashboard SQL Editor with service role
-- Option 2: Use the Node.js script: node scripts/create-verification-bucket.js
-- Option 3: Create manually in Supabase Dashboard → Storage
-- ============================================================================

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-documents',
    'verification-documents',
    false, -- Private bucket
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET 
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
    public = false;

-- ============================================================================
-- STORAGE POLICIES (These can run without service role)
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


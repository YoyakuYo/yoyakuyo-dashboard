-- ============================================================================
-- CREATE VERIFICATION DOCUMENTS STORAGE BUCKET
-- ============================================================================
-- This migration creates the storage bucket for shop verification documents
-- ============================================================================

-- Create storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-documents',
    'verification-documents',
    false, -- Private bucket (only authenticated users can access)
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

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


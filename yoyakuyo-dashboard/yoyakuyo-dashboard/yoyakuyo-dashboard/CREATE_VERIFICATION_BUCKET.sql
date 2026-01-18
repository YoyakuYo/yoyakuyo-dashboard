-- Create verification-documents Storage Bucket
-- This creates the bucket that the app uses for claim documents

-- IMPORTANT: This requires SERVICE ROLE permissions
-- If you get permission errors, create it manually in Supabase Dashboard:
-- 1. Go to Storage → New bucket
-- 2. Name: verification-documents
-- 3. Public: false (unchecked)
-- 4. File size limit: 10MB
-- 5. Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, application/pdf

-- Create storage bucket (requires service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-documents',
    'verification-documents',
    false, -- Private bucket (uses RLS policies)
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET 
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
    public = false;

-- Verify bucket was created
SELECT 
  'Bucket Created' AS status,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'verification-documents';


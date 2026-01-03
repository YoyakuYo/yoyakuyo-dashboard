-- ============================================
-- CREATE SUPPORT MESSAGES STORAGE BUCKET
-- ============================================
-- This migration creates storage policies for the support-messages bucket
-- NOTE: The bucket itself must be created manually in Supabase Dashboard first!
-- ============================================

-- Check if bucket exists and create policies only if it does
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'support-messages') THEN
    RAISE NOTICE '⚠️  Bucket "support-messages" does not exist yet. Skipping policy creation.
    
    Please create the bucket in Supabase Dashboard first:
    1. Go to Storage in Supabase Dashboard
    2. Click "New bucket"
    3. Name: support-messages
    4. Public: false (unchecked - private bucket)
    5. File size limit: 10 MB
    6. Allowed MIME types: 
       - application/pdf
       - image/jpeg
       - image/jpg
       - image/png
       - application/msword
       - application/vnd.openxmlformats-officedocument.wordprocessingml.document
    7. Click "Create bucket"
    
    After creating the bucket, run this migration again to create the storage policies.';
    RETURN;
  END IF;
END $$;

-- Only create policies if bucket exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'support-messages') THEN
    -- Storage Policy: Service role can manage all files
    DROP POLICY IF EXISTS "Service role can manage support messages files" ON storage.objects;
    CREATE POLICY "Service role can manage support messages files"
    ON storage.objects
    FOR ALL
    TO service_role
    USING (bucket_id = 'support-messages')
    WITH CHECK (bucket_id = 'support-messages');

    -- Storage Policy: Owners can upload files to their support conversations
    DROP POLICY IF EXISTS "Owners can upload files to support conversations" ON storage.objects;
    CREATE POLICY "Owners can upload files to support conversations"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'support-messages'
      AND EXISTS (
        SELECT 1 FROM conversations c
        JOIN shops s ON s.id = c.shop_id
        WHERE c.id::text = (storage.foldername(name))[1]
        AND s.owner_user_id = auth.uid()
        AND c.is_support_ticket = true
      )
    );

    -- Storage Policy: Owners can view files in their support conversations
    DROP POLICY IF EXISTS "Owners can view files in support conversations" ON storage.objects;
    CREATE POLICY "Owners can view files in support conversations"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'support-messages'
      AND EXISTS (
        SELECT 1 FROM conversations c
        JOIN shops s ON s.id = c.shop_id
        WHERE c.id::text = (storage.foldername(name))[1]
        AND s.owner_user_id = auth.uid()
        AND c.is_support_ticket = true
      )
    );

    -- Storage Policy: Admins can view files in all support conversations
    DROP POLICY IF EXISTS "Admins can view files in support conversations" ON storage.objects;
    CREATE POLICY "Admins can view files in support conversations"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'support-messages'
      AND EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id::text = (storage.foldername(name))[1]
        AND c.is_support_ticket = true
        AND EXISTS (
          SELECT 1 FROM admins a
          WHERE a.id = auth.uid()
          AND a.status = 'active'
        )
      )
    );

    -- Storage Policy: Admins can upload files to support conversations
    DROP POLICY IF EXISTS "Admins can upload files to support conversations" ON storage.objects;
    CREATE POLICY "Admins can upload files to support conversations"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'support-messages'
      AND EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id::text = (storage.foldername(name))[1]
        AND c.is_support_ticket = true
        AND EXISTS (
          SELECT 1 FROM admins a
          WHERE a.id = auth.uid()
          AND a.status = 'active'
        )
      )
    );
    
    -- Add comments to policies
    COMMENT ON POLICY "Service role can manage support messages files" ON storage.objects IS 'Allows service role to manage all files in support-messages bucket';
    COMMENT ON POLICY "Owners can upload files to support conversations" ON storage.objects IS 'Allows shop owners to upload files to their own support conversations';
    COMMENT ON POLICY "Owners can view files in support conversations" ON storage.objects IS 'Allows shop owners to view files in their own support conversations';
    COMMENT ON POLICY "Admins can view files in support conversations" ON storage.objects IS 'Allows active admins to view files in all support conversations';
    COMMENT ON POLICY "Admins can upload files to support conversations" ON storage.objects IS 'Allows active admins to upload files to support conversations';
    
    RAISE NOTICE '✅ Storage policies created successfully for support-messages bucket';
  ELSE
    RAISE NOTICE '⚠️  Bucket "support-messages" does not exist. Policies not created.';
  END IF;
END $$;

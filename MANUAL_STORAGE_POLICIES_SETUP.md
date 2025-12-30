# Manual Storage Policies Setup

## Problem
Storage policies cannot be created via SQL migrations without service role permissions. You need to create them manually in the Supabase Dashboard.

## ⚠️ IMPORTANT: Fix Recursion Issue

The previous policies caused infinite recursion. Use the **NEW SQL below** which fixes this issue.

## Solution

### Option 1: Via Supabase Dashboard SQL Editor (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the following SQL (UPDATED - fixes recursion):

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Owners can read their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can read all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete all verification documents" ON storage.objects;

-- Create helper function to avoid RLS recursion
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

-- Owners can read their own verification documents
-- File path structure: user_id/verification_id/filename
CREATE POLICY "Owners can read their verification documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'verification-documents'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Owners can upload verification documents
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

-- Staff can read all verification documents (uses function to avoid recursion)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_staff_user(UUID) TO authenticated;
```

4. Click **Run** to execute the SQL

### Option 2: Via Supabase Dashboard Storage UI

1. Go to **Storage** → **Policies**
2. Select the `verification-documents` bucket
3. Click **New Policy**
4. For each policy, use the SQL from Option 1 above

## File Path Structure

The policies expect files to be uploaded with this structure:
```
user_id/verification_id/filename
```

Example:
```
4a709fa3-9893-4230-beb4-d91aa42f322c/fc03cac9-e8f6-4e3f-bd5d-630ef379f4d2/1765002946354-screenshot.png
```

This is already implemented in `app/owner/claim/page.tsx` line 294.

## Verification

After running the policies, test by:
1. Going to the claim shop page
2. Uploading a document
3. It should upload successfully without RLS errors


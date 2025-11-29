# Setting Up Storage Policies for shop_photos Bucket

## Problem
Storage policies require elevated permissions that aren't available in regular migrations. The bucket can be created via SQL, but policies must be set up manually.

## Solution

### Option 1: Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → **Storage** → **Policies**
2. Select the **`shop_photos`** bucket
3. Click **"New Policy"** and create the following 4 policies:

#### Policy 1: Public Read Access
- **Name:** `Public can read shop photos`
- **Policy type:** `SELECT`
- **Target roles:** `public`
- **USING expression:**
  ```sql
  bucket_id = 'shop_photos'
  ```

#### Policy 2: Authenticated Upload
- **Name:** `Authenticated users can upload photos`
- **Policy type:** `INSERT`
- **Target roles:** `authenticated`
- **WITH CHECK expression:**
  ```sql
  bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
  ```

#### Policy 3: Authenticated Update
- **Name:** `Authenticated users can update photos`
- **Policy type:** `UPDATE`
- **Target roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
  ```

#### Policy 4: Authenticated Delete
- **Name:** `Authenticated users can delete photos`
- **Policy type:** `DELETE`
- **Target roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
  ```

### Option 2: SQL Editor (Alternative)

If you have access to the Supabase Dashboard SQL Editor (which runs with elevated permissions):

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the following SQL:

```sql
-- Public can read all photos
CREATE POLICY "Public can read shop photos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'shop_photos');

-- Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload photos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'shop_photos'
        AND auth.role() = 'authenticated'
    );

-- Authenticated users can update photos
CREATE POLICY "Authenticated users can update photos"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'shop_photos'
        AND auth.role() = 'authenticated'
    );

-- Authenticated users can delete photos
CREATE POLICY "Authenticated users can delete photos"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'shop_photos'
        AND auth.role() = 'authenticated'
    );
```

## Verification

After setting up the policies, test photo upload:

1. Log in to the dashboard
2. Go to **My Shop** → **Photos**
3. Try uploading a logo or cover photo
4. The upload should succeed without RLS errors

## Notes

- The bucket is created automatically by the migration
- Shop ownership is verified in the backend API (`/photos/upload` endpoint)
- The storage policies only check authentication, not shop ownership
- This is a security best practice: verify ownership at the API level, not just in storage policies


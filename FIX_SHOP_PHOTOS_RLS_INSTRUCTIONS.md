# Fix: shop_photos RLS Policy Violation

## Error
```
Failed to upload 1000017762.png: new row violates row-level security policy
```

## Root Cause
The INSERT policy for `shop_photos` bucket is either:
1. Missing
2. Has incorrect `WITH CHECK` expression
3. Blocks authenticated users

## Solution

### Step 1: Run the Migration

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- File: supabase/migrations/20250127_fix_shop_photos_insert_policy.sql
```

Or copy-paste this:

```sql
-- Drop ALL existing INSERT policies for shop_photos
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'INSERT'
      AND (
        qual LIKE '%shop_photos%' 
        OR with_check LIKE '%shop_photos%' 
        OR policyname LIKE '%shop_photos%'
        OR policyname LIKE '%upload%photos%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- Create correct INSERT policy
CREATE POLICY "Authenticated users can upload shop photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shop_photos'
    AND auth.role() = 'authenticated'
  );
```

### Step 2: Verify Policy Was Created

Run this verification query:

```sql
SELECT 
  policyname,
  cmd AS operation,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname = 'Authenticated users can upload shop photos'
  AND cmd = 'INSERT';
```

**Expected Result:**
- 1 row returned
- `policyname` = `"Authenticated users can upload shop photos"`
- `operation` = `INSERT`
- `with_check_expression` = `(bucket_id = 'shop_photos' AND auth.role() = 'authenticated')`

### Step 3: Test Upload

Try uploading a shop photo again. The error should be resolved.

## Alternative: If Migration Doesn't Work

If the migration fails or you get permission errors, create the policy manually:

1. Go to **Supabase Dashboard** → **Storage** → **Policies**
2. Select the `shop_photos` bucket
3. Click **New Policy**
4. Configure:
   - **Policy name**: `Authenticated users can upload shop photos`
   - **Allowed operation**: `INSERT`
   - **Policy definition**:
     ```sql
     bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
     ```
5. Click **Save**

## Troubleshooting

### Still Getting RLS Error?

1. **Check if user is authenticated:**
   ```sql
   SELECT auth.role(), auth.uid();
   ```
   Should return `authenticated` and a user ID.

2. **Check bucket exists:**
   ```sql
   SELECT id, name, public FROM storage.buckets WHERE id = 'shop_photos';
   ```

3. **Check all policies:**
   ```sql
   SELECT policyname, cmd, with_check
   FROM pg_policies
   WHERE schemaname = 'storage'
     AND tablename = 'objects'
     AND (qual LIKE '%shop_photos%' OR with_check LIKE '%shop_photos%');
   ```

### Policy Exists But Still Fails?

The `WITH CHECK` expression might be too restrictive. Try this more permissive policy:

```sql
DROP POLICY IF EXISTS "Authenticated users can upload shop photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload shop photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'shop_photos');
```

This allows ANY authenticated user to upload (less secure but works).


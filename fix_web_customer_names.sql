-- Fix WEB customer names: Populate users table with names from auth.users metadata
-- Run this to populate missing names for WEB customers

-- Step 1: Update existing users entries that have NULL full_name
UPDATE public.users u
SET 
    full_name = COALESCE(
        u.full_name,  -- Keep existing if present
        -- Get from auth.users metadata
        (SELECT 
            COALESCE(
                au.raw_user_meta_data->>'name',
                au.raw_user_meta_data->>'full_name',
                au.raw_user_meta_data->>'display_name'
            )
         FROM auth.users au 
         WHERE au.id = u.id
        ),
        -- Fallback: Format email as name (capitalize and replace dots/spaces)
        INITCAP(REPLACE(REPLACE(SPLIT_PART(u.email, '@', 1), '.', ' '), '_', ' '))
    ),
    updated_at = NOW()
WHERE u.full_name IS NULL
  AND EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.auth_user_id = u.id 
      AND c.role = 'web'
      AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = u.id)
  );

-- Step 2: Create users entries for WEB customers that don't have them (only if email doesn't exist)
INSERT INTO public.users (id, email, full_name, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        -- Try to get from auth.users metadata
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'display_name',
        -- Fallback: Format email as name
        INITCAP(REPLACE(REPLACE(SPLIT_PART(au.email, '@', 1), '.', ' '), '_', ' '))
    ) as full_name,
    au.created_at
FROM auth.users au
INNER JOIN public.customers c ON c.auth_user_id = au.id
WHERE c.role = 'web'
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.email = au.email)
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = au.id)
ON CONFLICT (id) DO UPDATE
SET 
    full_name = COALESCE(users.full_name, EXCLUDED.full_name),
    updated_at = NOW()
WHERE users.full_name IS NULL;

-- Step 3: Verify the fix
SELECT 
    'WEB CUSTOMERS WITH NAMES' as check_type,
    COUNT(*) as count
FROM public.customers c
INNER JOIN public.users u ON u.id = c.auth_user_id
WHERE c.role = 'web'
  AND u.full_name IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = c.auth_user_id);


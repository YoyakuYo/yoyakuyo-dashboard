-- Fix WEB customer names properly - get real names from auth.users metadata
-- This will replace IDs or wrong data with proper names

-- Step 1: Update existing users with proper names from auth.users metadata
UPDATE public.users u
SET 
    full_name = COALESCE(
        -- Only update if current name looks like an ID or is clearly wrong
        CASE 
            WHEN u.full_name IS NULL THEN NULL  -- Will be set below
            WHEN u.full_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN NULL  -- UUID pattern
            WHEN u.full_name LIKE 'line_%' THEN NULL  -- LINE ID pattern
            WHEN u.full_name LIKE 'U%' AND LENGTH(u.full_name) > 20 THEN NULL  -- LINE user ID
            ELSE u.full_name  -- Keep if it looks like a real name
        END,
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
        -- Fallback: Format email as proper name (capitalize, replace dots/underscores with spaces)
        INITCAP(REPLACE(REPLACE(REPLACE(SPLIT_PART(u.email, '@', 1), '.', ' '), '_', ' '), '-', ' '))
    ),
    updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM public.customers c 
    WHERE c.auth_user_id = u.id 
    AND c.role = 'web'
    AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = u.id)
)
AND (
    u.full_name IS NULL 
    OR u.full_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'  -- UUID
    OR u.full_name LIKE 'line_%'  -- LINE ID
    OR (u.full_name LIKE 'U%' AND LENGTH(u.full_name) > 20)  -- LINE user ID
);

-- Step 2: Create users entries for WEB customers that don't have them (only if email doesn't exist)
INSERT INTO public.users (id, email, full_name, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'display_name',
        INITCAP(REPLACE(REPLACE(REPLACE(SPLIT_PART(au.email, '@', 1), '.', ' '), '_', ' '), '-', ' '))
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
    full_name = COALESCE(
        users.full_name,
        EXCLUDED.full_name
    ),
    updated_at = NOW()
WHERE users.full_name IS NULL 
   OR users.full_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   OR users.full_name LIKE 'line_%'
   OR (users.full_name LIKE 'U%' AND LENGTH(users.full_name) > 20);

-- Step 3: Verify the fix
SELECT 
    'FIXED WEB CUSTOMERS' as check_type,
    u.id,
    u.email,
    u.full_name,
    CASE 
        WHEN u.full_name IS NULL THEN '❌ NO NAME'
        WHEN u.full_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '❌ STILL UUID'
        WHEN u.full_name LIKE 'line_%' THEN '❌ STILL LINE ID'
        WHEN u.full_name LIKE 'U%' AND LENGTH(u.full_name) > 20 THEN '❌ STILL LINE USER ID'
        ELSE '✅ PROPER NAME'
    END as status
FROM public.users u
INNER JOIN public.customers c ON c.auth_user_id = u.id
WHERE c.role = 'web'
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = u.id)
ORDER BY u.created_at DESC;


-- Verify if customers with role='line' are displayed correctly
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. Check customer role distribution
-- ============================================================
SELECT
  role,
  COUNT(*) as total_customers
FROM public.customers
GROUP BY role
ORDER BY role;

-- ============================================================
-- 2. Verify LINE customers have required fields
-- ============================================================
-- First check what columns exist in customers table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- Then get LINE customers (only select existing columns)
SELECT
  c.id,
  c.role,
  c.created_at
FROM public.customers c
WHERE c.role = 'line'
ORDER BY c.created_at DESC
LIMIT 50;

-- ============================================================
-- 3. Check for LINE customers mapping in line_accounts
-- ============================================================
-- Check if LINE customers have proper line_accounts mapping
SELECT
  c.id as customer_id,
  c.role,
  c.created_at,
  la.line_user_id,
  CASE
    WHEN la.line_user_id IS NOT NULL THEN '✅ Has line_accounts mapping'
    ELSE '❌ Missing line_accounts mapping'
  END as status
FROM public.customers c
LEFT JOIN public.line_accounts la ON la.customer_id = c.id
WHERE c.role = 'line'
ORDER BY c.created_at DESC
LIMIT 50;

-- ============================================================
-- 4. Check for customers with line_accounts but wrong role
-- ============================================================
SELECT
  c.id,
  c.role,
  la.line_user_id,
  c.created_at
FROM public.customers c
JOIN public.line_accounts la ON la.customer_id = c.id
WHERE c.role != 'line'
ORDER BY c.created_at DESC;

-- ============================================================
-- 5. Check line_accounts mapping for LINE customers
-- ============================================================
SELECT
  c.id as customer_id,
  c.role,
  c.created_at,
  la.line_user_id as mapped_line_user_id,
  CASE
    WHEN la.customer_id IS NOT NULL AND la.customer_id = c.id THEN '✅ Correct mapping'
    WHEN la.customer_id IS NULL THEN '❌ Missing line_accounts mapping'
    ELSE '❌ Mapping issue'
  END as status
FROM public.customers c
LEFT JOIN public.line_accounts la ON la.customer_id = c.id
WHERE c.role = 'line'
ORDER BY c.created_at DESC
LIMIT 50;

-- ============================================================
-- 6. Recent LINE customer activity (bookings)
-- ============================================================
SELECT
  b.id as booking_id,
  b.created_at as booking_created_at,
  b.source,
  b.status,
  c.id as customer_id,
  c.role as customer_role,
  la.line_user_id,
  s.name as shop_name
FROM public.bookings b
JOIN public.customers c ON c.id = b.customer_id
LEFT JOIN public.line_accounts la ON la.customer_id = c.id
LEFT JOIN public.shops s ON s.id = b.shop_id
WHERE c.role = 'line'
  AND b.created_at >= NOW() - INTERVAL '30 days'
ORDER BY b.created_at DESC
LIMIT 20;

-- ============================================================
-- 7. Check for display issues - customers that should be LINE but aren't
-- ============================================================
-- Look for customers that have line_accounts mapping but are classified as something else
SELECT
  c.id,
  c.role,
  la.line_user_id,
  c.created_at
FROM public.customers c
JOIN public.line_accounts la ON la.customer_id = c.id
WHERE c.role != 'line'
ORDER BY c.created_at DESC;
-- ============================================================================
-- VERIFICATION ONLY (read-only) – one query, one result. Safe to run anytime.
-- Run this in Supabase SQL Editor and paste the full result.
-- ============================================================================

SELECT object_name, status FROM (
  SELECT 1 AS ord, 'shop_verification_requests' AS object_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shop_verification_requests') THEN 'exists' ELSE 'missing' END AS status
  UNION ALL
  SELECT 2, 'shop_verification_documents',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shop_verification_documents') THEN 'exists' ELSE 'missing' END
  UNION ALL
  SELECT 3, 'shops',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shops') THEN 'exists' ELSE 'missing' END
  UNION ALL
  SELECT 4, 'auth.users',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN 'exists' ELSE 'missing' END
  UNION ALL
  SELECT 5, 'owner_profiles',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'owner_profiles') THEN 'exists' ELSE 'missing' END
) t
ORDER BY ord;

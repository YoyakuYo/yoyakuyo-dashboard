-- ============================================
-- VERIFICATION MIGRATION: Canonical Customer System
-- ============================================
-- Run this AFTER 20250205_canonical_customer_system_migration.sql
-- This migration verifies that all bookings are correctly linked to customers
-- ============================================

-- ============================================
-- VERIFICATION 1: Check for NULL customer_id
-- ============================================
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM bookings
  WHERE customer_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: % bookings still have NULL customer_id. Migration incomplete.', null_count;
  ELSE
    RAISE NOTICE '✅ VERIFICATION PASSED: All bookings have customer_id (0 NULL values)';
  END IF;
END $$;

-- ============================================
-- VERIFICATION 2: Check for invalid customer_id references
-- ============================================
DO $$
DECLARE
  invalid_count INTEGER;
  invalid_sample RECORD;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM bookings b
  WHERE b.customer_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = b.customer_id
    );
  
  IF invalid_count > 0 THEN
    -- Get a sample of invalid bookings
    SELECT b.id, b.customer_id INTO invalid_sample
    FROM bookings b
    WHERE b.customer_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM customers c
        WHERE c.id = b.customer_id
      )
    LIMIT 1;
    
    RAISE EXCEPTION 'VERIFICATION FAILED: % bookings have invalid customer_id. Example: booking_id=%, customer_id=%', 
      invalid_count, invalid_sample.id, invalid_sample.customer_id;
  ELSE
    RAISE NOTICE '✅ VERIFICATION PASSED: All customer_ids reference valid customers';
  END IF;
END $$;

-- ============================================
-- VERIFICATION 3: Count bookings by customer type
-- ============================================
DO $$
DECLARE
  total_count INTEGER;
  line_count INTEGER;
  web_count INTEGER;
  guest_count INTEGER;
  unclassified_count INTEGER;
BEGIN
  -- Total bookings
  SELECT COUNT(*) INTO total_count FROM bookings;
  
  -- LINE bookings (have line_accounts)
  SELECT COUNT(DISTINCT b.id) INTO line_count
  FROM bookings b
  JOIN line_accounts la ON la.customer_id = b.customer_id;
  
  -- WEB bookings (customer role, no line_accounts)
  SELECT COUNT(DISTINCT b.id) INTO web_count
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  WHERE c.role = 'customer'
    AND NOT EXISTS (
      SELECT 1 FROM line_accounts la 
      WHERE la.customer_id = c.id
    );
  
  -- GUEST bookings (guest role)
  SELECT COUNT(DISTINCT b.id) INTO guest_count
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  WHERE c.role = 'guest';
  
  -- Unclassified (should be 0)
  SELECT COUNT(DISTINCT b.id) INTO unclassified_count
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  WHERE c.role NOT IN ('customer', 'guest')
    OR (c.role = 'customer' AND NOT EXISTS (
      SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id
    ) AND NOT EXISTS (
      SELECT 1 FROM auth.users au WHERE au.id = c.id
    ));
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BOOKING COUNTS BY CUSTOMER TYPE:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total bookings: %', total_count;
  RAISE NOTICE 'LINE bookings: %', line_count;
  RAISE NOTICE 'WEB bookings: %', web_count;
  RAISE NOTICE 'GUEST bookings: %', guest_count;
  RAISE NOTICE 'Unclassified: %', unclassified_count;
  RAISE NOTICE '========================================';
  
  -- Verify counts add up (allowing for some overlap if a customer has both LINE and WEB)
  IF (line_count + web_count + guest_count) < total_count THEN
    RAISE WARNING 'Count mismatch: LINE + WEB + GUEST (%) < Total (%). Some bookings may be counted in multiple categories.', 
      (line_count + web_count + guest_count), total_count;
  END IF;
END $$;

-- ============================================
-- VERIFICATION 4: Sample data inspection
-- ============================================
-- Create a view for easy inspection (doesn't modify data)
CREATE OR REPLACE VIEW verification_booking_customer_links AS
SELECT 
  b.id as booking_id,
  b.customer_id,
  b.source,
  b.status,
  b.created_at as booking_created_at,
  c.role as customer_role,
  c.created_at as customer_created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'LINE'
    WHEN c.role = 'customer' AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id) THEN 'WEB'
    WHEN c.role = 'guest' THEN 'GUEST'
    ELSE 'UNKNOWN'
  END as customer_type,
  la.line_user_id,
  au.email as web_customer_email
FROM bookings b
JOIN customers c ON c.id = b.customer_id
LEFT JOIN line_accounts la ON la.customer_id = c.id
LEFT JOIN auth.users au ON au.id = c.id
ORDER BY b.created_at DESC;

COMMENT ON VIEW verification_booking_customer_links IS 'View for verifying booking-customer links after migration';

-- ============================================
-- VERIFICATION 5: Check for orphaned data
-- ============================================
DO $$
DECLARE
  orphaned_customers INTEGER;
  orphaned_line_accounts INTEGER;
BEGIN
  -- Customers with no bookings
  SELECT COUNT(*) INTO orphaned_customers
  FROM customers c
  WHERE NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.customer_id = c.id
  )
  AND c.role != 'owner'; -- Owners don't need bookings
  
  -- Line accounts with no bookings
  SELECT COUNT(*) INTO orphaned_line_accounts
  FROM line_accounts la
  WHERE NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.customer_id = la.customer_id
  );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ORPHANED DATA CHECK:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Customers with no bookings: % (this is OK - customers may not have booked yet)', orphaned_customers;
  RAISE NOTICE 'Line accounts with no bookings: % (this is OK - LINE users may not have booked yet)', orphaned_line_accounts;
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION 6: Data consistency checks
-- ============================================
DO $$
DECLARE
  source_mismatch_count INTEGER;
  web_without_auth_count INTEGER;
  line_without_account_count INTEGER;
BEGIN
  -- Check if bookings.source matches customer type
  SELECT COUNT(*) INTO source_mismatch_count
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  WHERE (
    (b.source = 'line' AND NOT EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id))
    OR (b.source = 'web' AND c.role = 'guest')
    OR (b.source = 'guest' AND c.role != 'guest')
  );
  
  -- WEB customers should have auth.users entry
  SELECT COUNT(*) INTO web_without_auth_count
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  WHERE c.role = 'customer'
    AND NOT EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id);
  
  -- LINE customers should have line_accounts entry
  SELECT COUNT(*) INTO line_without_account_count
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  WHERE EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id)
    AND b.source != 'line';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATA CONSISTENCY CHECKS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bookings with source/customer_type mismatch: %', source_mismatch_count;
  RAISE NOTICE 'WEB customers without auth.users entry: %', web_without_auth_count;
  RAISE NOTICE 'LINE customers with source != line: %', line_without_account_count;
  RAISE NOTICE '========================================';
  
  IF source_mismatch_count > 0 THEN
    RAISE WARNING 'Some bookings have source field that does not match customer type. This may be expected if source was set incorrectly before migration.';
  END IF;
  
  IF web_without_auth_count > 0 THEN
    RAISE WARNING 'Some WEB customers do not have auth.users entry. This may indicate data inconsistency.';
  END IF;
END $$;

-- ============================================
-- VERIFICATION 7: Summary report
-- ============================================
DO $$
DECLARE
  total_bookings INTEGER;
  total_customers INTEGER;
  total_line_accounts INTEGER;
  bookings_with_customer_id INTEGER;
  customers_with_bookings INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_bookings FROM bookings;
  SELECT COUNT(*) INTO total_customers FROM customers WHERE role != 'owner';
  SELECT COUNT(*) INTO total_line_accounts FROM line_accounts;
  SELECT COUNT(*) INTO bookings_with_customer_id FROM bookings WHERE customer_id IS NOT NULL;
  SELECT COUNT(DISTINCT customer_id) INTO customers_with_bookings FROM bookings;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION VERIFICATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total bookings: %', total_bookings;
  RAISE NOTICE 'Bookings with customer_id: %', bookings_with_customer_id;
  RAISE NOTICE 'Total customers: %', total_customers;
  RAISE NOTICE 'Customers with bookings: %', customers_with_bookings;
  RAISE NOTICE 'Total LINE accounts: %', total_line_accounts;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF bookings_with_customer_id = total_bookings THEN
    RAISE NOTICE '✅ SUCCESS: All bookings are linked to customers';
  ELSE
    RAISE EXCEPTION '❌ FAILURE: Not all bookings are linked. Expected %, got %', 
      total_bookings, bookings_with_customer_id;
  END IF;
END $$;

-- ============================================
-- HELPER: Query to inspect specific booking
-- ============================================
-- Use this query to inspect a specific booking:
-- SELECT * FROM verification_booking_customer_links WHERE booking_id = 'your-booking-id';

-- ============================================
-- HELPER: Query to see booking distribution
-- ============================================
-- Use this query to see how bookings are distributed:
-- SELECT customer_type, COUNT(*) as count 
-- FROM verification_booking_customer_links 
-- GROUP BY customer_type 
-- ORDER BY count DESC;


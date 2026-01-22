-- ============================================
-- ANALYZE WEB CUSTOMERS BEFORE CONVERSION
-- ============================================

-- STEP 1: Count web customers and their data
SELECT
  'WEB CUSTOMERS ANALYSIS' as section,
  COUNT(*) as total_web_customers
FROM customers
WHERE role = 'web';

-- STEP 2: Web customer bookings
SELECT
  'WEB CUSTOMER BOOKINGS' as section,
  COUNT(*) as total_bookings,
  COUNT(DISTINCT b.customer_id) as customers_with_bookings,
  COALESCE(STRING_AGG(DISTINCT b.source::text, ', '), 'none') as booking_sources
FROM customers c
LEFT JOIN bookings b ON b.customer_id = c.id
WHERE c.role = 'web';

-- STEP 3: Web customer messages (through conversations)
SELECT
  'WEB CUSTOMER MESSAGES' as section,
  COUNT(*) as total_messages,
  COUNT(DISTINCT c.id) as customers_with_messages
FROM customers c
LEFT JOIN conversations conv ON conv.customer_type = 'web' AND conv.customer_ref = c.auth_user_id::text
LEFT JOIN messages m ON m.conversation_id = conv.id
WHERE c.role = 'web';

-- STEP 4: Web customer threads
SELECT
  'WEB CUSTOMER THREADS' as section,
  COUNT(*) as total_threads,
  COUNT(DISTINCT t.customer_id) as customers_with_threads
FROM customers c
LEFT JOIN shop_threads t ON t.customer_id = c.id
WHERE c.role = 'web';

-- STEP 5: Web customer reviews
SELECT
  'WEB CUSTOMER REVIEWS' as section,
  COUNT(*) as total_reviews,
  COUNT(DISTINCT r.user_id) as customers_with_reviews
FROM customers c
LEFT JOIN reviews r ON r.user_id = c.id
WHERE c.role = 'web';

-- STEP 6: Check if there's already a guest customer account
SELECT
  'EXISTING GUEST CUSTOMER' as section,
  COUNT(*) as guest_customers_count,
  COALESCE(STRING_AGG(email, ', '), 'none') as guest_emails
FROM customers
WHERE role = 'guest';
-- ============================================
-- DETAILED WEB CUSTOMERS LIST
-- ============================================

SELECT
  c.id,
  c.email,
  c.name,
  c.created_at,
  (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) as booking_count,
  (SELECT COUNT(*) FROM conversations conv
   LEFT JOIN messages m ON m.conversation_id = conv.id
   WHERE conv.customer_type = 'web' AND conv.customer_ref = c.auth_user_id::text) as message_count,
  (SELECT COUNT(*) FROM shop_threads t WHERE t.customer_id = c.id) as thread_count,
  (SELECT COUNT(*) FROM reviews r WHERE r.user_id = c.id) as review_count
FROM customers c
WHERE c.role = 'web'
ORDER BY c.created_at DESC;
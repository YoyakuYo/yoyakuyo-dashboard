-- ============================================================================
-- BOOKING CONVERSATION STATUS: See which bookings have conversations
-- ============================================================================

-- Summary of bookings with/without conversations
SELECT
    CASE WHEN b.conversation_id IS NOT NULL THEN 'HAS_CONVERSATION' ELSE 'MISSING_CONVERSATION' END as status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bookings), 2) as percentage
FROM bookings b
GROUP BY CASE WHEN b.conversation_id IS NOT NULL THEN 'HAS_CONVERSATION' ELSE 'MISSING_CONVERSATION' END;

-- Sample bookings WITHOUT conversations (missing ones)
SELECT
    b.id as booking_id,
    b.created_at,
    COALESCE(c.name, c.email, 'Unknown') as customer_name,
    c.email as customer_email,
    s.name as shop_name,
    '❌ Missing conversation' as status
FROM bookings b
LEFT JOIN customers c ON c.id = b.customer_id
LEFT JOIN shops s ON s.id = b.shop_id
WHERE b.conversation_id IS NULL
  AND c.email IS NOT NULL  -- Only show bookings with customer emails (can message)
ORDER BY b.created_at DESC
LIMIT 10;

-- Sample bookings WITH conversations (working ones)
SELECT
    b.id as booking_id,
    b.created_at,
    COALESCE(c.name, c.email, 'Unknown') as customer_name,
    c.email as customer_email,
    s.name as shop_name,
    '✅ Has conversation' as status
FROM bookings b
LEFT JOIN customers c ON c.id = b.customer_id
LEFT JOIN shops s ON s.id = b.shop_id
WHERE b.conversation_id IS NOT NULL
  AND c.email IS NOT NULL  -- Only show bookings with customer emails (can message)
ORDER BY b.created_at DESC
LIMIT 10;
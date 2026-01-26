-- ============================================================================
-- CHECK MISSING CONVERSATIONS: Only show bookings without conversations
-- ============================================================================

-- Summary first
SELECT
    CASE WHEN b.conversation_id IS NOT NULL THEN 'HAS_CONVERSATION' ELSE 'MISSING_CONVERSATION' END as status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bookings), 2) as percentage
FROM bookings b
GROUP BY CASE WHEN b.conversation_id IS NOT NULL THEN 'HAS_CONVERSATION' ELSE 'MISSING_CONVERSATION' END;

-- ONLY the missing ones (the ones causing the message button issue)
SELECT
    b.id as booking_id,
    b.created_at,
    COALESCE(c.name, c.email, 'Unknown') as customer_name,
    c.email as customer_email,
    s.name as shop_name,
    '❌ MISSING CONVERSATION - No message button will show' as issue
FROM bookings b
LEFT JOIN customers c ON c.id = b.customer_id
LEFT JOIN shops s ON s.id = b.shop_id
WHERE b.conversation_id IS NULL
  AND c.email IS NOT NULL  -- Only bookings with customer emails (can be messaged)
ORDER BY b.created_at DESC;
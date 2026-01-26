-- ============================================================================
-- CHECK CONVERSATION DETAILS: Why message buttons still not showing
-- ============================================================================

-- Check what types of conversations exist
SELECT
    conversation_type,
    target_type,
    COUNT(*) as count
FROM conversations
GROUP BY conversation_type, target_type
ORDER BY count DESC;

-- Check booking_owner conversations specifically
SELECT
    c.id as conversation_id,
    c.conversation_type,
    c.target_type,
    c.target_id,
    c.customer_type,
    c.customer_ref,
    b.id as booking_id,
    cust.email as customer_email,
    s.name as shop_name
FROM conversations c
JOIN bookings b ON b.conversation_id = c.id
LEFT JOIN customers cust ON cust.id = b.customer_id
LEFT JOIN shops s ON s.id::text = c.target_id
WHERE c.conversation_type = 'booking_owner'
  AND c.target_type = 'shop'
ORDER BY b.created_at DESC
LIMIT 10;

-- Check if conversations have proper participants
SELECT
    c.id as conversation_id,
    c.conversation_type,
    COUNT(p.id) as participant_count,
    STRING_AGG(p.participant_type, ', ') as participant_types
FROM conversations c
LEFT JOIN conversation_participants p ON p.conversation_id = c.id
WHERE c.conversation_type = 'booking_owner'
GROUP BY c.id, c.conversation_type
ORDER BY participant_count ASC
LIMIT 10;

-- Check API query simulation (what the frontend expects)
SELECT
    b.id as booking_id,
    b.customer_email,
    COALESCE(c.name, c.email, 'Unknown') as customer_name,
    CASE WHEN conv.id IS NOT NULL THEN '✅ Will show message button' ELSE '❌ No message button' END as status,
    conv.id as conversation_id,
    conv.conversation_type,
    conv.target_type
FROM bookings b
LEFT JOIN customers c ON c.id = b.customer_id
LEFT JOIN conversations conv ON conv.id = b.conversation_id
WHERE b.customer_email IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 20;
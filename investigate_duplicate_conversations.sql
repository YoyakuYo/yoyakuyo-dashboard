-- ============================================================================
-- INVESTIGATE DUPLICATE CONVERSATIONS: Why customers have multiple conversations
-- ============================================================================

-- Check conversations grouped by customer and shop
SELECT
    c.customer_ref,
    c.customer_type,
    cust.name as customer_name,
    cust.email as customer_email,
    cust.role as customer_role,
    COUNT(*) as conversation_count,
    STRING_AGG(DISTINCT c.conversation_type::text, ', ') as conversation_types,
    STRING_AGG(DISTINCT c.target_type::text, ', ') as target_types,
    STRING_AGG(DISTINCT s.name, ', ') as shop_names
FROM conversations c
LEFT JOIN customers cust ON cust.id::text = c.customer_ref
LEFT JOIN shops s ON s.id::text = c.target_id
WHERE c.conversation_type = 'booking_owner'
  AND c.target_type = 'shop'
GROUP BY c.customer_ref, c.customer_type, cust.name, cust.email, cust.role
HAVING COUNT(*) > 1
ORDER BY conversation_count DESC, customer_name;

-- Check detailed conversation data for duplicate customers
SELECT
    'Alpha (LINE)' as customer,
    c.id as conversation_id,
    c.created_at,
    c.booking_id,
    cust.email as customer_email,
    s.name as shop_name,
    CASE WHEN c.booking_id IS NOT NULL THEN 'Has booking' ELSE 'No booking' END as booking_status
FROM conversations c
LEFT JOIN bookings b ON b.conversation_id = c.id
LEFT JOIN customers cust ON cust.id::text = c.customer_ref
LEFT JOIN shops s ON s.id::text = c.target_id
WHERE c.customer_ref = (
    SELECT id::text FROM customers
    WHERE name = 'Alpha' AND role = 'line'
    LIMIT 1
)
  AND c.conversation_type = 'booking_owner'
ORDER BY c.created_at DESC;

-- Check detailed conversation data for AMOUREE
SELECT
    'AMOUREE (Guest)' as customer,
    c.id as conversation_id,
    c.created_at,
    c.booking_id,
    cust.email as customer_email,
    s.name as shop_name,
    CASE WHEN c.booking_id IS NOT NULL THEN 'Has booking' ELSE 'No booking' END as booking_status
FROM conversations c
LEFT JOIN bookings b ON b.conversation_id = c.id
LEFT JOIN customers cust ON cust.id::text = c.customer_ref
LEFT JOIN shops s ON s.id::text = c.target_id
WHERE c.customer_ref = (
    SELECT id::text FROM customers
    WHERE name = 'AMOUREE' AND role = 'guest'
    LIMIT 1
)
  AND c.conversation_type = 'booking_owner'
ORDER BY c.created_at DESC;

-- Check if there are conversations without booking_id (orphaned)
SELECT
    COUNT(*) as orphaned_conversations,
    customer_type,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM conversations WHERE conversation_type = 'booking_owner') as percentage
FROM conversations
WHERE conversation_type = 'booking_owner'
  AND booking_id IS NULL
GROUP BY customer_type;

-- Check conversations that share the same customer_ref and shop (should be unique)
SELECT
    customer_ref,
    target_id,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as conversation_ids
FROM conversations
WHERE conversation_type = 'booking_owner'
  AND target_type = 'shop'
GROUP BY customer_ref, target_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
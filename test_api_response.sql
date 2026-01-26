-- ============================================================================
-- TEST API RESPONSE: What does the bookings API actually return?
-- ============================================================================
-- This simulates what the frontend receives from /bookings endpoint
-- ============================================================================

-- Simulate the API response (what frontend sees)
SELECT
    b.id,
    b.created_at,
    -- Customer data (enriched)
    COALESCE(c.name, c.email, 'Unknown') as customer_name,
    c.email as customer_email,
    -- Shop data
    s.name as shop_name,
    -- Service data
    svc.name as service_name,
    svc.price,
    -- Conversations (this is what the frontend checks)
    json_build_array(
        json_build_object(
            'id', conv.id,
            'conversation_type', conv.conversation_type,
            'target_type', conv.target_type,
            'target_id', conv.target_id,
            'customer_type', conv.customer_type,
            'customer_ref', conv.customer_ref
        )
    ) as conversations,
    -- Check if conversations array would be truthy
    CASE
        WHEN conv.id IS NOT NULL THEN '✅ conversations.length > 0 (button shows)'
        ELSE '❌ conversations is null/empty (no button)'
    END as frontend_status
FROM bookings b
LEFT JOIN customers c ON c.id = b.customer_id
LEFT JOIN shops s ON s.id = b.shop_id
LEFT JOIN services svc ON svc.id = b.service_id
LEFT JOIN conversations conv ON conv.id = b.conversation_id
WHERE c.email IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 5;
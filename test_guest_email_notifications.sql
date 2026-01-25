-- Test guest email notifications
-- Check if guest conversations exist with valid emails

SELECT
    c.id as conversation_id,
    c.customer_type,
    c.customer_ref,
    cust.name as guest_name,
    cust.email as guest_email,
    c.target_id as shop_id,
    s.name as shop_name,
    c.created_at
FROM conversations c
LEFT JOIN customers cust ON cust.id = c.customer_ref::uuid AND cust.role = 'guest'
LEFT JOIN shops s ON s.id = c.target_id
WHERE c.customer_type = 'guest'
  AND c.target_id IS NOT NULL
  AND cust.email IS NOT NULL
ORDER BY c.created_at DESC
LIMIT 5;
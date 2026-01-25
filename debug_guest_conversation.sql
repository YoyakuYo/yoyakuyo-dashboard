-- Debug guest conversation issue
-- Check if the problematic conversation exists and has correct data

SELECT
    c.id,
    c.target_id,
    c.customer_type,
    c.customer_ref,
    c.booking_id,
    c.conversation_type,
    c.target_type,
    c.created_at,
    s.owner_user_id as shop_owner,
    s.name as shop_name,
    cust.name as customer_name,
    cust.email as customer_email
FROM conversations c
LEFT JOIN shops s ON s.id = c.target_id
LEFT JOIN customers cust ON cust.id = c.customer_ref::uuid AND cust.role = 'guest'
WHERE c.id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- Check if there are messages for this conversation
SELECT
    COUNT(*) as message_count,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
FROM messages
WHERE conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420';

SELECT
    id,
    conversation_id,
    sender_id,
    content,
    is_read,
    created_at
FROM messages
WHERE conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420'
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are multiple conversations for the same guest
SELECT
    c.id,
    c.customer_type,
    c.customer_ref,
    c.target_id,
    c.created_at,
    COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.customer_type = 'guest'
  AND c.customer_ref = (SELECT customer_ref FROM conversations WHERE id = 'b1178685-b981-4191-bf52-2ecad8d66420')
GROUP BY c.id, c.customer_type, c.customer_ref, c.target_id, c.created_at
ORDER BY c.created_at DESC;

-- Check conversation participants
SELECT
    conversation_id,
    participant_type,
    participant_ref,
    user_id,
    line_user_id
FROM conversation_participants
WHERE conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420';
-- Check LINE customer conversations by type
SELECT
    'LINE TO SHOP (Inbox)' as conversation_category,
    COUNT(*) as conversation_count,
    STRING_AGG(c.id::text, ', ') as conversation_ids
FROM conversations c
WHERE c.customer_type = 'line'
AND c.conversation_type = 'booking_owner'
AND c.target_type = 'shop';

SELECT
    'LINE TO ADMIN (Support)' as conversation_category,
    COUNT(*) as conversation_count,
    STRING_AGG(c.id::text, ', ') as conversation_ids
FROM conversations c
WHERE c.customer_type = 'line'
AND c.conversation_type = 'support_admin'
AND c.target_type = 'admin';

-- Detailed view of LINE conversations
SELECT
    c.id,
    c.conversation_type,
    c.target_type,
    c.target_id,
    c.customer_type,
    c.customer_ref,
    c.created_at,
    CASE
        WHEN c.conversation_type = 'booking_owner' THEN 'SHOP CONVERSATION (Inbox)'
        WHEN c.conversation_type = 'support_admin' THEN 'ADMIN CONVERSATION (Support)'
        ELSE 'UNKNOWN'
    END as display_category
FROM conversations c
WHERE c.customer_type = 'line'
ORDER BY c.conversation_type, c.created_at DESC;

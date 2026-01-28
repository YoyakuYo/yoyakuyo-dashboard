-- ============================================================================
-- IDENTIFY SPECIFIC CUSTOMERS FROM CONVERSATION DATA
-- ============================================================================
-- Run this query in Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

SELECT
    c.id as conversation_id,
    c.conversation_type,
    c.customer_type,
    c.customer_ref,
    c.last_message_at,

    -- Customer Display Name
    CASE
        WHEN c.customer_type = 'line' THEN
            COALESCE(
                p.display_name,
                la.display_name,
                'LINE User: ' || LEFT(c.customer_ref, 8) || '...'
            )
        WHEN c.customer_type = 'guest' THEN
            COALESCE(
                p.display_name,
                cust.name,
                'Guest: ' || LEFT(c.customer_ref, 8) || '...'
            )
        WHEN c.customer_type = 'web' THEN
            COALESCE(
                p.display_name,
                u.raw_user_meta_data->>'name',
                u.email,
                'Web User: ' || LEFT(c.customer_ref, 8) || '...'
            )
        ELSE 'Unknown Customer'
    END as customer_name,

    -- Shop/target info
    CASE
        WHEN c.conversation_type = 'booking_owner' THEN
            (SELECT s.name FROM shops s WHERE s.id = c.target_id::uuid)
        WHEN c.conversation_type = 'support_admin' THEN 'SYSTEM SUPPORT'
        ELSE 'UNKNOWN'
    END as shop_name,

    -- Message counts
    COALESCE(msg_stats.message_count, 0) as messages,
    COALESCE(msg_stats.unread_count, 0) as unread

FROM conversations c

-- Join with participants table (unified identity system)
LEFT JOIN participants p ON (
    (c.customer_type = 'line' AND p.source = 'line' AND p.source_id = c.customer_ref) OR
    (c.customer_type = 'guest' AND p.source = 'guest' AND p.source_id = c.customer_ref) OR
    (c.customer_type = 'web' AND p.source = 'web' AND p.source_id = c.customer_ref)
)

-- Join with line_accounts for LINE users
LEFT JOIN line_accounts la ON c.customer_type = 'line' AND la.line_user_id = c.customer_ref

-- Join with customers table for guest users
LEFT JOIN customers cust ON c.customer_type = 'guest' AND cust.id = c.customer_ref::uuid

-- Join with auth.users for web users
LEFT JOIN auth.users u ON c.customer_type = 'web' AND u.id = c.customer_ref::uuid

-- Join with message counts
LEFT JOIN (
    SELECT
        conversation_id,
        COUNT(*) as message_count,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
    FROM messages
    GROUP BY conversation_id
) msg_stats ON msg_stats.conversation_id = c.id

WHERE c.id IN (
    '6ac09ee0-e6b7-4414-aa1e-8bbcfb794187',
    '35c526c2-264b-4c3e-aeba-bc7166ec5805',
    'b1178685-b981-4191-bf52-2ecad8d66420',
    '2d594e1b-1e50-4c3a-9bad-50fbd514b3fb',
    '85a51d11-2457-4eb9-9cdb-49d57f186b00',
    'f6049616-713f-4a97-82d6-aa30ff4f6dfb',
    'aa9c4398-6ee0-40b0-b3b2-16d9b5120ddf',
    '26048661-e6de-4d92-b0ac-e598f9a459c2',
    '32a60894-d327-46b2-af12-d48e745d9ecd',
    'c5937582-22ac-4d92-9afc-130a5faf13c0',
    '521f9c80-12d0-45fd-af4e-29cb3f09ecfb',
    '2e9827b1-0a6c-4fc1-8512-effe99b15f09',
    'c8bc2720-f718-4658-a6fc-cb606c402234',
    'bb2c5558-ea1a-4a86-b08f-fccb7478c5a8',
    '099a2789-852b-470a-9e30-02d78431b6ec',
    '26a1f4b4-6ea0-498b-be43-27cfc69711e8',
    '296ffab8-85ae-4648-87b7-1ab8764895ef',
    '1f9e6b56-d7bd-45d2-bf6c-e12c1c2f8f9a',
    '480e75fb-40c3-4936-908c-877085ffa9da'
)

ORDER BY c.last_message_at DESC;
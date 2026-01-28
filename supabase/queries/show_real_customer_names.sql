-- ============================================================================
-- SHOW REAL CUSTOMER NAMES FOR CONVERSATIONS
-- ============================================================================
-- LINE customers: customer_ref = line_user_id, names from line_user_mappings
-- Guest/Web customers: customer_ref = customers.id, stored in customers table

SELECT
    c.id as conversation_id,
    c.conversation_type,
    c.customer_type,
    c.customer_ref,
    c.last_message_at,

    -- Customer Name (different sources for different customer types)
    CASE
        WHEN c.customer_type = 'line' THEN
            COALESCE(cp_line.line_display_name, lum.line_display_name, p.display_name, 'LINE User')
        WHEN c.customer_type IN ('guest', 'web') THEN
            COALESCE(cust.name, 'No Name')
        ELSE 'Unknown'
    END as customer_name,

    -- Customer Role
    CASE
        WHEN c.customer_type = 'line' THEN 'line'
        ELSE cust.role
    END as customer_role,

    -- Customer Email
    CASE
        WHEN c.customer_type = 'line' THEN NULL
        ELSE cust.email
    END as customer_email,

    -- Shop Name
    CASE
        WHEN c.conversation_type = 'booking_owner' THEN
            (SELECT s.name FROM shops s WHERE s.id = c.target_id::uuid)
        WHEN c.conversation_type = 'support_admin' THEN 'SYSTEM SUPPORT'
        ELSE 'UNKNOWN'
    END as shop_name,

    -- Message Statistics
    COALESCE(msg_stats.message_count, 0) as total_messages,
    COALESCE(msg_stats.unread_count, 0) as unread_messages,

    -- Customer Registration Date
    CASE
        WHEN c.customer_type = 'line' THEN COALESCE(cp_line.created_at, lum.created_at, la.created_at)
        ELSE cust.created_at
    END as customer_since

FROM conversations c

-- For LINE customers: check multiple sources for names
LEFT JOIN line_accounts la ON c.customer_type = 'line' AND la.line_user_id = c.customer_ref
LEFT JOIN line_user_mappings lum ON c.customer_type = 'line' AND lum.line_user_id = c.customer_ref
LEFT JOIN customer_profiles cp_line ON c.customer_type = 'line' AND cp_line.line_user_id = c.customer_ref

-- For Guest/Web customers: direct join to customers table
LEFT JOIN customers cust ON c.customer_type IN ('guest', 'web') AND cust.id::text = c.customer_ref

-- Try participants table as fallback for LINE user display names
LEFT JOIN participants p ON c.customer_type = 'line' AND p.source IN ('line', 'owner') AND p.source_id = c.customer_ref

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

ORDER BY c.customer_type,
    CASE
        WHEN c.customer_type = 'line' THEN COALESCE(cp_line.line_display_name, lum.line_display_name, p.display_name, 'LINE User')
        WHEN c.customer_type IN ('guest', 'web') THEN COALESCE(cust.name, 'No Name')
        ELSE 'Unknown'
    END,
    c.last_message_at DESC;
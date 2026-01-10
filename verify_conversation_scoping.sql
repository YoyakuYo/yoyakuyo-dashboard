-- ============================================
-- CONVERSATION SCOPING VERIFICATION QUERY
-- ============================================
-- Run this query to verify the conversation scoping implementation
-- and identify any mismatches or issues

-- 1. OVERVIEW: Total conversations by type
SELECT
    COUNT(*) as total_conversations,
    COUNT(CASE WHEN conversation_type IS NULL THEN 1 END) as missing_conversation_type,
    COUNT(CASE WHEN target_type IS NULL THEN 1 END) as missing_target_type,
    COUNT(CASE WHEN target_id IS NULL THEN 1 END) as missing_target_id,
    COUNT(CASE WHEN conversation_type = 'booking_owner' THEN 1 END) as booking_owner_conversations,
    COUNT(CASE WHEN conversation_type = 'support_admin' THEN 1 END) as support_admin_conversations,
    COUNT(CASE WHEN conversation_type = 'admin_owner' THEN 1 END) as admin_owner_conversations
FROM conversations;

-- 2. CONVERSATION TYPES BREAKDOWN
SELECT
    conversation_type,
    target_type,
    COUNT(*) as count,
    COUNT(DISTINCT target_id) as unique_targets,
    COUNT(CASE WHEN booking_id IS NOT NULL THEN 1 END) as with_booking_id,
    COUNT(CASE WHEN is_support_ticket = true THEN 1 END) as support_tickets
FROM conversations
GROUP BY conversation_type, target_type
ORDER BY conversation_type, target_type;

-- 3. BOOKING_OWNER CONVERSATIONS ANALYSIS
SELECT
    'BOOKING_OWNER_ANALYSIS' as analysis_type,
    COUNT(*) as total_booking_conversations,
    COUNT(CASE WHEN target_type != 'shop' THEN 1 END) as wrong_target_type,
    COUNT(CASE WHEN booking_id IS NULL THEN 1 END) as missing_booking_id,
    COUNT(CASE WHEN target_id != shop_id THEN 1 END) as target_id_mismatch
FROM conversations
WHERE conversation_type = 'booking_owner';

-- 4. SUPPORT_ADMIN CONVERSATIONS ANALYSIS
SELECT
    'SUPPORT_ADMIN_ANALYSIS' as analysis_type,
    COUNT(*) as total_support_conversations,
    COUNT(CASE WHEN target_type != 'admin' THEN 1 END) as wrong_target_type,
    COUNT(CASE WHEN is_support_ticket != true THEN 1 END) as missing_support_flag
FROM conversations
WHERE conversation_type = 'support_admin';

-- 5. POTENTIAL ISSUES: Conversations with wrong scoping
SELECT
    id,
    conversation_type,
    target_type,
    target_id,
    shop_id,
    booking_id,
    customer_type,
    customer_ref,
    is_support_ticket,
    created_at
FROM conversations
WHERE
    -- Booking conversations should have shop target and booking_id
    (conversation_type = 'booking_owner' AND (target_type != 'shop' OR booking_id IS NULL))
    OR
    -- Support conversations should have admin target and support flag
    (conversation_type = 'support_admin' AND (target_type != 'admin' OR is_support_ticket != true))
    OR
    -- Conversations with null required fields
    (conversation_type IS NULL OR target_type IS NULL OR target_id IS NULL)
ORDER BY created_at DESC
LIMIT 20;

-- 6. SAMPLE CONVERSATIONS BY TYPE (first 5 of each)
SELECT 'BOOKING_OWNER_SAMPLES' as sample_type, id, target_id, booking_id, customer_ref, created_at
FROM conversations
WHERE conversation_type = 'booking_owner'
ORDER BY created_at DESC
LIMIT 5;

SELECT 'SUPPORT_ADMIN_SAMPLES' as sample_type, id, target_id, customer_ref, is_support_ticket, created_at
FROM conversations
WHERE conversation_type = 'support_admin'
ORDER BY created_at DESC
LIMIT 5;

SELECT 'UNSCOPED_CONVERSATIONS' as sample_type, id, shop_id, customer_ref, is_support_ticket, created_at
FROM conversations
WHERE conversation_type IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- 7. CUSTOMER CONVERSATION COUNTS (potential duplicates)
SELECT
    customer_ref,
    customer_type,
    COUNT(*) as total_conversations,
    COUNT(DISTINCT conversation_type) as unique_conversation_types,
    COUNT(DISTINCT target_id) as unique_targets,
    STRING_AGG(DISTINCT conversation_type::text, ', ') as conversation_types
FROM conversations
GROUP BY customer_ref, customer_type
HAVING COUNT(*) > 1
ORDER BY total_conversations DESC
LIMIT 10;

-- 8. DETAILED ANALYSIS OF MULTIPLE CONVERSATIONS PER CUSTOMER
SELECT
    c.customer_ref,
    c.customer_type,
    c.id as conversation_id,
    c.conversation_type,
    c.target_type,
    c.target_id,
    c.booking_id,
    c.shop_id,
    c.created_at
FROM conversations c
WHERE c.customer_ref IN (
    SELECT customer_ref
    FROM conversations
    GROUP BY customer_ref, customer_type
    HAVING COUNT(*) > 1
)
ORDER BY c.customer_ref, c.created_at DESC;

-- 9. NULL TARGET_ID ISSUES (CRITICAL - these violate scoping rules)
SELECT
    'NULL_TARGET_ID_CRITICAL' as issue_type,
    COUNT(*) as affected_conversations,
    STRING_AGG(DISTINCT customer_type::text, ', ') as customer_types,
    STRING_AGG(DISTINCT conversation_type::text, ', ') as conversation_types
FROM conversations
WHERE target_id IS NULL;

SELECT
    id,
    conversation_type,
    target_type,
    customer_ref,
    customer_type,
    shop_id,
    booking_id,
    created_at
FROM conversations
WHERE target_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

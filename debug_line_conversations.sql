-- DEBUG: Check what conversations are returned for LINE customers

-- 1. What should be returned by inbox (booking_owner only)
SELECT 'INBOX_SHOULD_RETURN' as query_type, COUNT(*) as count
FROM conversations
WHERE customer_type = 'line'
AND conversation_type = 'booking_owner';

-- 2. What should be returned by support (support_admin only)
SELECT 'SUPPORT_SHOULD_RETURN' as query_type, COUNT(*) as count
FROM conversations
WHERE customer_type = 'line'
AND conversation_type = 'support_admin';

-- 3. What inbox actually returns (with current filtering)
SELECT 'INBOX_ACTUAL_RETURN' as query_type, COUNT(*) as count
FROM conversations
WHERE customer_type = 'line'
AND (conversation_type = 'booking_owner' OR conversation_type IS NULL);

-- 4. What support actually returns (with current filtering)
SELECT 'SUPPORT_ACTUAL_RETURN' as query_type, COUNT(*) as count
FROM conversations
WHERE customer_type = 'line'
AND conversation_type = 'support_admin'
AND target_type = 'admin';

-- 5. Show actual conversations for a LINE customer
SELECT
    conversation_type,
    target_type,
    target_id,
    customer_ref,
    created_at
FROM conversations
WHERE customer_type = 'line'
ORDER BY created_at DESC
LIMIT 10;

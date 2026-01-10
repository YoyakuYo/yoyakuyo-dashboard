-- ============================================
-- CONVERSATION SCOPING FIXES
-- ============================================
-- Run this after the migration to fix any remaining issues

-- 1. FIX NULL TARGET_ID ISSUES
UPDATE conversations SET
    target_id = shop_id::text
WHERE target_id IS NULL
AND conversation_type = 'booking_owner'
AND shop_id IS NOT NULL;

UPDATE conversations SET
    target_id = 'system'
WHERE target_id IS NULL
AND conversation_type = 'support_admin';

-- 2. FIX MISSING CONVERSATION TYPES (fallback for unscoped conversations)
UPDATE conversations SET
    conversation_type = 'booking_owner',
    target_type = 'shop',
    target_id = COALESCE(shop_id, 'unknown')
WHERE conversation_type IS NULL
AND shop_id IS NOT NULL;

UPDATE conversations SET
    conversation_type = 'support_admin',
    target_type = 'admin',
    target_id = 'system'
WHERE conversation_type IS NULL
AND is_support_ticket = true;

-- 3. FIX ORPHANED BOOKING_OWNER CONVERSATIONS
-- These conversations claim to be booking_owner but have no shop_id or booking_id
-- Option A: Convert to support_admin if they were actually support conversations
-- Option B: Delete them if they're truly orphaned

-- First, let's see if any of these have messages that indicate they were support conversations
CREATE TEMP TABLE orphaned_booking_conversations AS
SELECT
    c.id,
    c.customer_ref,
    c.customer_type,
    COUNT(m.id) as message_count,
    STRING_AGG(LEFT(m.body, 100), ' | ') as recent_messages
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.conversation_type = 'booking_owner'
AND c.shop_id IS NULL
AND c.booking_id IS NULL
GROUP BY c.id, c.customer_ref, c.customer_type;

-- CHOOSE ONE OF THE FOLLOWING OPTIONS FOR ORPHANED CONVERSATIONS:

-- OPTION 1: Convert to support_admin conversations
-- Use this if these conversations were actually customer support chats
/*
UPDATE conversations SET
    conversation_type = 'support_admin',
    target_type = 'admin',
    target_id = 'system',
    is_support_ticket = true
WHERE conversation_type = 'booking_owner'
AND shop_id IS NULL
AND booking_id IS NULL;
*/

-- OPTION 2: Delete orphaned conversations (PERMANENT - CAUTION!)
-- Only use this if conversations contain no valuable messages
/*
DELETE FROM messages WHERE conversation_id IN (
    SELECT id FROM conversations
    WHERE conversation_type = 'booking_owner'
    AND shop_id IS NULL
    AND booking_id IS NULL
);

DELETE FROM conversations
WHERE conversation_type = 'booking_owner'
AND shop_id IS NULL
AND booking_id IS NULL;
*/

-- OPTION 3: Keep as orphaned but mark for admin review
-- (This is what's currently applied - conversations are marked but preserved)
/*
-- Already applied: target_id = 'orphaned_booking_conversation'
-- These will be visible in admin interface for manual review
*/

-- For now, let's just mark them for review
UPDATE conversations SET
    target_id = 'orphaned_booking_conversation'
WHERE conversation_type = 'booking_owner'
AND shop_id IS NULL
AND booking_id IS NULL
AND target_id IS NULL;

-- 4. VERIFY FIXES
SELECT
    'AFTER_FIXES' as status,
    COUNT(*) as total_conversations,
    COUNT(CASE WHEN conversation_type IS NULL THEN 1 END) as still_missing_conversation_type,
    COUNT(CASE WHEN target_type IS NULL THEN 1 END) as still_missing_target_type,
    COUNT(CASE WHEN target_id IS NULL THEN 1 END) as still_missing_target_id,
    COUNT(CASE WHEN target_id = 'orphaned_booking_conversation' THEN 1 END) as orphaned_booking_conversations,
    COUNT(CASE WHEN conversation_type = 'booking_owner' THEN 1 END) as booking_owner_conversations,
    COUNT(CASE WHEN conversation_type = 'support_admin' THEN 1 END) as support_admin_conversations
FROM conversations;

-- 5. REPORT REMAINING ISSUES
SELECT
    'REMAINING_ISSUES' as report,
    COUNT(*) as problematic_conversations
FROM conversations
WHERE
    conversation_type IS NULL
    OR target_type IS NULL
    OR target_id IS NULL
    OR (conversation_type = 'booking_owner' AND target_type != 'shop')
    OR (conversation_type = 'support_admin' AND target_type != 'admin');

-- 6. SHOW ORPHANED CONVERSATIONS FOR MANUAL REVIEW
SELECT
    'ORPHANED_CONVERSATIONS' as status,
    id,
    customer_ref,
    customer_type,
    created_at
FROM conversations
WHERE target_id = 'orphaned_booking_conversation'
ORDER BY created_at DESC;

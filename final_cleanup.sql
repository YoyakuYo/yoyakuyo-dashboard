-- ============================================================================
-- FINAL CLEANUP: Remove the remaining duplicate conversation
-- ============================================================================

-- Find the exact duplicate
SELECT
    'DUPLICATE FOUND' as status,
    customer_ref,
    target_id,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as conversation_ids,
    STRING_AGG(created_at::text, ', ') as created_dates
FROM conversations
WHERE conversation_type = 'booking_owner'
  AND target_type = 'shop'
GROUP BY customer_ref, target_id
HAVING COUNT(*) > 1;

-- Delete all but the most recent conversation for the duplicate pair
DELETE FROM conversations
WHERE conversation_type = 'booking_owner'
  AND target_type = 'shop'
  AND id NOT IN (
      SELECT DISTINCT ON (customer_ref, target_id) id
      FROM conversations
      WHERE conversation_type = 'booking_owner'
        AND target_type = 'shop'
      ORDER BY customer_ref, target_id, created_at DESC
  );

-- Verify cleanup
SELECT
    'AFTER FINAL CLEANUP' as status,
    COUNT(*) as total_conversations,
    COUNT(DISTINCT customer_ref || '-' || target_id) as unique_pairs,
    COUNT(*) - COUNT(DISTINCT customer_ref || '-' || target_id) as remaining_duplicates
FROM conversations
WHERE conversation_type = 'booking_owner'
  AND target_type = 'shop';
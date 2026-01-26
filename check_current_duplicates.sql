-- Check current duplicate status
SELECT
    'CURRENT STATUS' as check_type,
    COUNT(*) as total_conversations,
    COUNT(DISTINCT customer_ref || '-' || target_id) as unique_pairs,
    COUNT(*) - COUNT(DISTINCT customer_ref || '-' || target_id) as current_duplicates
FROM conversations
WHERE conversation_type = 'booking_owner'
  AND target_type = 'shop';

-- Check if there are still any duplicates
SELECT
    customer_ref,
    target_id,
    COUNT(*) as conversation_count,
    STRING_AGG(id::text, ', ') as conversation_ids
FROM conversations
WHERE conversation_type = 'booking_owner'
  AND target_type = 'shop'
GROUP BY customer_ref, target_id
HAVING COUNT(*) > 1
ORDER BY conversation_count DESC;
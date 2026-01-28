-- ============================================================================
-- DEBUG: Check what's actually in the participants table for these customers
-- ============================================================================

-- Check participants for the LINE user
SELECT 'LINE Customer Debug' as debug_type, *
FROM participants
WHERE source = 'line' AND source_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- Check participants for some guest customers
SELECT 'Guest Customer Debug' as debug_type, *
FROM participants
WHERE source = 'guest' AND source_id IN (
    'e0893e0c-46d9-43da-abcb-d179d6804587',
    '34f4d105-1c7b-4a78-a5f1-0d27c52fd216',
    '5ebfeca7-a532-46f9-a475-3dcf53ae8c2a'
);

-- Check what source types exist in participants
SELECT source, COUNT(*) as count
FROM participants
GROUP BY source
ORDER BY count DESC;

-- Check if participants exist for any of our conversation customer_refs
SELECT
    c.customer_type,
    c.customer_ref,
    CASE WHEN p.id IS NOT NULL THEN 'FOUND' ELSE 'NOT FOUND' END as participant_status,
    p.display_name,
    p.source,
    p.source_id
FROM conversations c
LEFT JOIN participants p ON (
    (c.customer_type = 'line' AND p.source = 'line' AND p.source_id = c.customer_ref) OR
    (c.customer_type = 'guest' AND p.source = 'guest' AND p.source_id = c.customer_ref) OR
    (c.customer_type = 'web' AND p.source = 'web' AND p.source_id = c.customer_ref)
)
WHERE c.id IN (
    '6ac09ee0-e6b7-4414-aa1e-8bbcfb794187',
    'f6049616-713f-4a97-82d6-aa30ff4f6dfb',
    'b1178685-b981-4191-bf52-2ecad8d66420'
);
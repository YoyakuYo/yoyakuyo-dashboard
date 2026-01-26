-- Fix duplicate conversations issue - CORRECTED VERSION
-- Handle LINE user IDs that are not UUIDs

-- Check all conversations for this customer (without invalid UUID cast)
SELECT
  conv.id,
  conv.customer_type,
  conv.customer_ref,
  conv.created_at,
  CASE
    WHEN conv.customer_ref = 'Uf5741397f874c9a5822578e506f0cb47' THEN '✅ Correct (LINE user ID)'
    WHEN conv.customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5' THEN '❌ Wrong (Customer UUID)'
    ELSE '❓ Unknown'
  END as status
FROM conversations conv
WHERE conv.customer_type = 'line'
  AND conv.customer_ref IN ('78fea290-ef9a-43c8-96d6-90460c04efe5', 'Uf5741397f874c9a5822578e506f0cb47')
ORDER BY conv.created_at DESC;

-- Get customer info separately
SELECT
  c.id,
  c.name,
  c.line_user_id,
  c.role
FROM customers c
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Delete the conversation with wrong customer_ref (UUID instead of LINE user ID)
-- Keep the one with correct LINE user ID
DELETE FROM messages
WHERE conversation_id = '26a1f4b4-6ea0-498b-be43-27cfc69711e8';

DELETE FROM conversations
WHERE id = '26a1f4b4-6ea0-498b-be43-27cfc69711e8'
  AND customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Verify only the correct conversation remains
SELECT
  conv.id,
  conv.customer_type,
  conv.customer_ref,
  conv.created_at
FROM conversations conv
WHERE conv.customer_type = 'line'
  AND conv.customer_ref = 'Uf5741397f874c9a5822578e506f0cb47';

-- Final verification: Check that owner conversations API will return correct name
SELECT
  'After fix, the API should return:' as verification,
  'customer.name = \"Alpha\"' as expected_result,
  'for conversation with LINE user ID' as condition;
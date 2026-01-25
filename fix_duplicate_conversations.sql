-- Fix duplicate conversations issue
-- Customer has 2 conversations with different customer_ref values

-- Check all conversations for this customer
SELECT
  conv.id,
  conv.customer_type,
  conv.customer_ref,
  conv.created_at,
  c.name as customer_name,
  c.line_user_id,
  CASE
    WHEN conv.customer_ref = c.line_user_id THEN '✅ Correct (LINE user ID)'
    WHEN conv.customer_ref = c.id::text THEN '❌ Wrong (Customer UUID)'
    ELSE '❓ Unknown'
  END as status
FROM conversations conv
LEFT JOIN customers c ON c.line_user_id = conv.customer_ref OR c.id = conv.customer_ref::uuid
WHERE conv.customer_type = 'line'
  AND (conv.customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5'
       OR conv.customer_ref = 'Uf5741397f874c9a5822578e506f0cb47')
ORDER BY conv.created_at DESC;

-- Fix: Delete the conversation with wrong customer_ref (UUID instead of LINE user ID)
-- Keep the one with correct LINE user ID
DELETE FROM conversations
WHERE id = '26a1f4b4-6ea0-498b-be43-27cfc69711e8'
  AND customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Also delete any messages associated with the wrong conversation
DELETE FROM messages
WHERE conversation_id = '26a1f4b4-6ea0-498b-be43-27cfc69711e8';

-- Verify only the correct conversation remains
SELECT
  conv.id,
  conv.customer_type,
  conv.customer_ref,
  c.name as customer_name
FROM conversations conv
LEFT JOIN customers c ON c.line_user_id = conv.customer_ref
WHERE conv.customer_type = 'line'
  AND conv.customer_ref = 'Uf5741397f874c9a5822578e506f0cb47';

-- Alternative fix: Update the wrong conversation to use correct customer_ref
-- UPDATE conversations
-- SET customer_ref = 'Uf5741397f874c9a5822578e506f0cb47'
-- WHERE id = '26a1f4b4-6ea0-498b-be43-27cfc69711e8'
--   AND customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5';
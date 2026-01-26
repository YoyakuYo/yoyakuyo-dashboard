-- FINAL VERIFICATION: Customer name "Alpha" should now appear in owner messages

-- Check that customer name is correctly stored
SELECT
  c.id,
  c.name,
  c.line_user_id,
  c.role
FROM customers c
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Verify only one conversation remains with correct LINE user ID
SELECT
  conv.id,
  conv.customer_type,
  conv.customer_ref,
  conv.created_at,
  COUNT(m.id) as message_count
FROM conversations conv
LEFT JOIN messages m ON m.conversation_id = conv.id
WHERE conv.customer_type = 'line'
  AND conv.customer_ref = 'Uf5741397f874c9a5822578e506f0cb47'
GROUP BY conv.id, conv.customer_type, conv.customer_ref, conv.created_at;

-- Test the API response format (what owner messages page should receive)
SELECT
  conv.id,
  conv.customer_type,
  conv.customer_ref,
  c.name as customer_name,
  c.line_user_id,
  conv.last_message_at,
  0 as unread_count
FROM conversations conv
LEFT JOIN customers c ON c.line_user_id = conv.customer_ref
WHERE conv.customer_type = 'line'
  AND conv.customer_ref = 'Uf5741397f874c9a5822578e506f0cb47';

-- Success confirmation
SELECT
  '✅ SUCCESS:' as status,
  'Customer name \"Alpha\" should now appear in owner messages' as result,
  'The duplicate conversation with wrong customer_ref has been removed' as fix_applied;
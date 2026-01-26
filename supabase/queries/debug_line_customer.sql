-- ============================================================================
-- DEBUG: Check LINE user data for specific customer
-- ============================================================================

-- Check if LINE user exists in line_user_mappings
SELECT 'LINE User Mappings' as table_name, * FROM line_user_mappings
WHERE line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- Check if LINE user exists in line_accounts
SELECT 'LINE Accounts' as table_name, * FROM line_accounts
WHERE line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- Check customer_profiles for LINE users
SELECT 'Customer Profiles' as table_name, id, line_user_id, line_display_name, name, email, created_at FROM customer_profiles
WHERE line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- Check participants table for LINE users
SELECT 'Participants' as table_name, * FROM participants
WHERE source IN ('line', 'owner') AND source_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- Check what tables actually exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%line%'
ORDER BY table_name;

-- Check if the customer_ref exists in conversations
SELECT id, customer_type, customer_ref FROM conversations
WHERE customer_ref = 'Uf5741397f874c9a5822578e506f0cb47';
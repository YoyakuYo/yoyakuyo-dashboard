-- Fix permissive RLS policies that bypass row-level security
-- This addresses policies that use USING (true) or WITH CHECK (true) inappropriately

-- ============================================
-- REVIEW AND FIX PROBLEMATIC POLICIES
-- ============================================

-- WARNING: Many "Service role can access all" policies are intentionally permissive
-- for administrative access. Only fixing obviously problematic ones.

-- ============================================
-- FIX 1: customer_ai_messages - "Anyone can insert customer AI messages"
-- ============================================
-- This policy allows anyone to insert, which is too permissive.
-- Should restrict to authenticated users or specific roles.

DROP POLICY IF EXISTS "Anyone can insert customer AI messages" ON customer_ai_messages;
CREATE POLICY "Authenticated users can insert customer AI messages"
ON customer_ai_messages
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- FIX 2: line_user_mappings - "Allow LINE mapping inserts"
-- ============================================
-- This allows unrestricted inserts. Should restrict to authenticated users.

DROP POLICY IF EXISTS "Allow LINE mapping inserts" ON line_user_mappings;
CREATE POLICY "Authenticated users can insert LINE mappings"
ON line_user_mappings
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- FIX 3: platform_reviews - "Public can create platform reviews"
-- ============================================
-- This allows unrestricted inserts. Should allow anonymous reviews but maybe rate limit.

-- Keep this one as is for now - public reviews are likely intended
-- But add rate limiting consideration in comments

-- ============================================
-- FIX 4: visitor_sessions - "allow_anonymous_visitor_tracking"
-- ============================================
-- This allows unrestricted inserts for visitor tracking, which is likely intentional
-- Keep this one as is

-- ============================================
-- NOTES ON SERVICE ROLE POLICIES
-- ============================================
-- The following policies use "Service role can access all..." and are likely intentional:
-- - admin_users
-- - admins
-- - ai_conversations
-- - ai_message_logs
-- - conversation_state
-- - conversations
-- - customer_profiles
-- - customers
-- - disputes
-- - guest_identity
-- - messages
-- - notifications
-- - owner_push_subscriptions
-- - owners
-- - payments
-- - platform_reviews (Service role policy)
-- - services
-- - sessions
-- - shop_ai_knowledge
-- - shop_ai_settings
-- - shop_claim_files
-- - shop_claim_requests
-- - shop_notifications
-- - shops_backup_no_address
-- - shops_deleted_backup
-- - subscriptions
-- - web_customer_bookings_backup
-- - web_customers_backup
--
-- These are administrative policies for service roles and are typically intentional.
-- Only modify if you understand the security implications.

COMMENT ON POLICY "Authenticated users can insert customer AI messages" ON customer_ai_messages IS 'Restricts AI message inserts to authenticated users only (fixed permissive access)';
COMMENT ON POLICY "Authenticated users can insert LINE mappings" ON line_user_mappings IS 'Restricts LINE mapping inserts to authenticated users only (fixed permissive access)';
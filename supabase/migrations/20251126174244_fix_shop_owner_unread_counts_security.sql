-- ============================================================================
-- Fix SECURITY DEFINER issue in shop_owner_unread_counts view
-- ============================================================================
-- This migration adds ownership checks to the get_shop_owner_unread_counts()
-- function to ensure users can only see unread counts for shops they own.
-- This fixes the security issue where SECURITY DEFINER was bypassing RLS
-- without proper ownership filtering.

-- Replace the function to include ownership checks
CREATE OR REPLACE FUNCTION get_shop_owner_unread_counts()
RETURNS TABLE (
    shop_id UUID,
    thread_id UUID,
    unread_count BIGINT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
    SELECT 
        st.shop_id,
        st.id AS thread_id,
        COALESCE(COUNT(sm.id) FILTER (WHERE sm.read_by_owner = FALSE AND sm.sender_type != 'owner'), 0)::BIGINT AS unread_count
    FROM shop_threads st
    LEFT JOIN shop_messages sm ON sm.thread_id = st.id
    INNER JOIN shops s ON s.id = st.shop_id
    WHERE s.owner_user_id = auth.uid()  -- Security fix: Only return shops owned by the authenticated user
    GROUP BY st.shop_id, st.id;
$$;

-- Update the comment to reflect the security fix
COMMENT ON FUNCTION get_shop_owner_unread_counts() IS 'Aggregates unread message counts per shop and thread for owners. Includes ownership check to ensure users only see their own shops (SECURITY DEFINER with auth.uid() filter)';

COMMENT ON VIEW shop_owner_unread_counts IS 'Aggregates unread message counts per shop and thread for owners. Security: Function filters by auth.uid() to ensure users only see their own shops';


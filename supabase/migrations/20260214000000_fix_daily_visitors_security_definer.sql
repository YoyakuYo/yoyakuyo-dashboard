-- Fix SECURITY DEFINER issue on daily_visitors view
-- This addresses the security linter error where SECURITY DEFINER bypasses RLS

-- Drop and recreate the view without SECURITY DEFINER (defaults to SECURITY INVOKER)
DROP VIEW IF EXISTS daily_visitors CASCADE;

CREATE OR REPLACE VIEW daily_visitors AS
SELECT
  DATE(created_at) as visit_date,
  COUNT(DISTINCT session_id) as unique_visitors,
  COUNT(*) as total_page_views,
  COUNT(DISTINCT ip_address) as unique_ips
FROM visitor_sessions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY visit_date DESC;

-- Explicitly set SECURITY INVOKER (though this is the default)
ALTER VIEW daily_visitors SET (security_invoker = true);

-- Add comment
COMMENT ON VIEW daily_visitors IS 'Daily visitor statistics for the last 30 days (SECURITY INVOKER)';
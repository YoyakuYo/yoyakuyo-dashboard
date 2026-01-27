-- Add visitor tracking system for analytics
-- This enables real-time visitor counting in the admin dashboard

-- Create visitor tracking table
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  customer_id UUID REFERENCES customers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_created_at ON visitor_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session_id ON visitor_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_last_activity ON visitor_sessions(last_activity);

-- Create view for daily visitor counts
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

-- Create function to clean old visitor data (older than 90 days)
CREATE OR REPLACE FUNCTION clean_old_visitor_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM visitor_sessions
  WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
END;
$$;

-- RLS policies for visitor_sessions
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for visitor tracking
CREATE POLICY "allow_anonymous_visitor_tracking"
ON visitor_sessions
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to read their own sessions
CREATE POLICY "users_read_own_visitor_sessions"
ON visitor_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to read all visitor data
CREATE POLICY "admins_read_all_visitor_sessions"
ON visitor_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = auth.uid()
      AND c.is_admin = true
  )
);

-- Comments
COMMENT ON TABLE visitor_sessions IS 'Tracks website visitor sessions and page views for analytics';
COMMENT ON VIEW daily_visitors IS 'Daily visitor statistics for the last 30 days';
COMMENT ON FUNCTION clean_old_visitor_data() IS 'Clean visitor data older than 90 days to manage storage';
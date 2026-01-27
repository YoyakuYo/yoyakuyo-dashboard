-- Add owner presence tracking system
-- Tracks which shop owners are currently online (live presence)

-- Create owner_presence table
CREATE TABLE IF NOT EXISTS owner_presence (
  owner_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_owner_presence_shop_id ON owner_presence(shop_id);
CREATE INDEX IF NOT EXISTS idx_owner_presence_last_seen ON owner_presence(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_owner_presence_updated_at ON owner_presence(updated_at);

-- RLS policies for owner_presence
ALTER TABLE owner_presence ENABLE ROW LEVEL SECURITY;

-- Allow owners to update their own presence (via service role in API)
-- Note: API will use supabaseAdmin to bypass RLS, but we still define policies for direct access
CREATE POLICY "owners_update_own_presence"
ON owner_presence
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM shops s
    WHERE s.id = owner_presence.shop_id
      AND s.owner_user_id = auth.uid()
  )
);

-- Allow admins to read all presence data
CREATE POLICY "admin_read_owner_presence"
ON owner_presence
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.auth_user_id = auth.uid()
      AND c.is_admin = true
  )
);

-- Create function to clean stale presence (older than 5 minutes = offline)
CREATE OR REPLACE FUNCTION get_online_owners()
RETURNS TABLE (
  owner_user_id UUID,
  shop_id UUID,
  shop_name TEXT,
  owner_email TEXT,
  last_seen_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    op.owner_user_id,
    op.shop_id,
    s.name as shop_name,
    u.email as owner_email,
    op.last_seen_at,
    op.ip_address,
    op.user_agent
  FROM owner_presence op
  JOIN shops s ON s.id = op.shop_id
  JOIN auth.users u ON u.id = op.owner_user_id
  WHERE op.last_seen_at > now() - INTERVAL '5 minutes'
  ORDER BY op.last_seen_at DESC;
END;
$$;

-- Comments
COMMENT ON TABLE owner_presence IS 'Tracks which shop owners are currently online (presence tracking)';
COMMENT ON FUNCTION get_online_owners() IS 'Returns list of owners who were active in the last 5 minutes';

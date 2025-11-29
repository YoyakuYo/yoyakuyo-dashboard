-- Migration: Separate Owner and Customer Authentication
-- Creates independent auth tables for owners and customers with role-based sessions

-- ============================================
-- 1. owners table (independent auth)
-- ============================================
CREATE TABLE IF NOT EXISTS owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS owners_email_idx ON owners(email);

-- Enable RLS
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for owners
DROP POLICY IF EXISTS "Owners can read own record" ON owners;
DROP POLICY IF EXISTS "Service role can manage owners" ON owners;

CREATE POLICY "Owners can read own record"
ON owners
FOR SELECT
USING (true); -- Will be filtered by application logic

CREATE POLICY "Service role can manage owners"
ON owners
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 2. customers table (independent auth)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS customers_email_idx ON customers(email);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
DROP POLICY IF EXISTS "Customers can read own record" ON customers;
DROP POLICY IF EXISTS "Service role can manage customers" ON customers;

CREATE POLICY "Customers can read own record"
ON customers
FOR SELECT
USING (true); -- Will be filtered by application logic

CREATE POLICY "Service role can manage customers"
ON customers
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 3. sessions table (role-based)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'customer')),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
DROP POLICY IF EXISTS "Users can read own sessions" ON sessions;
DROP POLICY IF EXISTS "Service role can manage sessions" ON sessions;

CREATE POLICY "Users can read own sessions"
ON sessions
FOR SELECT
USING (true); -- Will be filtered by application logic

CREATE POLICY "Service role can manage sessions"
ON sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 4. Update existing tables to use new IDs
-- ============================================
-- Link customer_profiles to customers table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_profiles' AND column_name = 'id') THEN
        -- Add foreign key if customer_profiles exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'customer_profiles_customer_id_fkey'
        ) THEN
            ALTER TABLE customer_profiles
            ADD COLUMN IF NOT EXISTS customer_auth_id UUID REFERENCES customers(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Link users table to owners table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id') THEN
        -- Add foreign key if users exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'users_owner_id_fkey'
        ) THEN
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS owner_auth_id UUID REFERENCES owners(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE owners IS 'Independent authentication table for shop owners';
COMMENT ON TABLE customers IS 'Independent authentication table for customers';
COMMENT ON TABLE sessions IS 'Role-based session management for owners and customers';


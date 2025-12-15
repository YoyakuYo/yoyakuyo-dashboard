-- ============================================
-- REBUILD CANONICAL BOOKING SYSTEM
-- ============================================
-- This migration completely rebuilds the booking system
-- with a single source of truth: customers table
-- All bookings reference customers.id
-- LINE/Web/Guest are entry methods, not separate identities

-- ============================================
-- STEP 1 — DELETE ALL EXISTING BROKEN STRUCTURE
-- ============================================

DROP TABLE IF EXISTS line_bookings CASCADE;
DROP TABLE IF EXISTS web_bookings CASCADE;
DROP TABLE IF EXISTS guest_bookings CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS booking_requests CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS booking_history CASCADE;
DROP TABLE IF EXISTS pending_bookings CASCADE;
DROP TABLE IF EXISTS confirmed_bookings CASCADE;

-- Drop any old booking tables regardless of naming
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename ILIKE '%booking%'
      AND tablename != 'bookings' -- Keep the main bookings table for now
  ) LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    RAISE NOTICE 'Dropped table: %', r.tablename;
  END LOOP;
END $$;

-- ============================================
-- STEP 2 — CANONICAL CUSTOMERS TABLE (SINGLE SOURCE OF TRUTH)
-- ============================================

DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('guest','customer','owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_role ON customers(role);

-- ============================================
-- STEP 3 — LINE ACCOUNT LINKING (MAPPING ONLY)
-- ============================================

DROP TABLE IF EXISTS line_accounts CASCADE;

CREATE TABLE line_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_accounts_customer_id ON line_accounts(customer_id);
CREATE INDEX idx_line_accounts_line_user_id ON line_accounts(line_user_id);

-- ============================================
-- STEP 4 — BACKUP EXISTING BOOKINGS DATA
-- ============================================

-- Create temporary table to store existing booking data
CREATE TABLE IF NOT EXISTS bookings_backup AS
SELECT 
  b.*,
  b.user_id as old_user_id,
  b.line_user_id as old_line_user_id,
  b.guest_id as old_guest_id,
  b.booking_type as old_booking_type
FROM bookings b;

-- ============================================
-- STEP 5 — RECREATE BOOKINGS TABLE (ALL USERS, ALL FLOWS)
-- ============================================

-- Drop existing bookings table constraints first
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.bookings'::regclass
  ) LOOP
    EXECUTE 'ALTER TABLE bookings DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
  END LOOP;
END $$;

-- Drop and recreate bookings table
DROP TABLE IF EXISTS bookings CASCADE;

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  source TEXT NOT NULL CHECK (source IN ('line','web','guest')),
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','cancelled','completed','rejected')),
  booked_for TIMESTAMPTZ NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_shop_id ON bookings(shop_id);
CREATE INDEX idx_bookings_source ON bookings(source);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booked_for ON bookings(booked_for);

-- ============================================
-- STEP 6 — MIGRATE EXISTING DATA
-- ============================================

-- Function to get or create customer from LINE user
CREATE OR REPLACE FUNCTION get_or_create_customer_from_line(line_user_id_param TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_customer_id UUID;
  new_auth_user_id UUID;
BEGIN
  -- Check if line_accounts already exists
  SELECT la.customer_id INTO existing_customer_id
  FROM line_accounts la
  WHERE la.line_user_id = line_user_id_param
  LIMIT 1;

  IF existing_customer_id IS NOT NULL THEN
    RETURN existing_customer_id;
  END IF;

  -- Create new auth user (passwordless)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  )
  VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'line_' || line_user_id_param || '@line.user',
    '',
    now(),
    now(),
    now(),
    '{"provider":"line","providers":["line"]}'::jsonb,
    jsonb_build_object('line_user_id', line_user_id_param),
    false,
    'authenticated'
  )
  RETURNING id INTO new_auth_user_id;

  -- Create customer
  INSERT INTO customers (id, role)
  VALUES (new_auth_user_id, 'customer')
  ON CONFLICT (id) DO NOTHING;

  -- Create line_accounts mapping
  INSERT INTO line_accounts (customer_id, line_user_id)
  VALUES (new_auth_user_id, line_user_id_param)
  ON CONFLICT (line_user_id) DO UPDATE SET customer_id = EXCLUDED.customer_id;

  RETURN new_auth_user_id;
END;
$$;

-- Migrate existing bookings
-- This will be done in a separate step after customers are created
-- For now, we'll create a migration script

-- ============================================
-- STEP 7 — OWNER VIEW IS NOT A NEW TABLE
-- ============================================

-- Owners read the SAME bookings table filtered by shop ownership
CREATE OR REPLACE VIEW owner_bookings AS
SELECT
  b.*,
  s.name as shop_name,
  s.owner_id
FROM bookings b
JOIN shops s ON s.id = b.shop_id;

-- ============================================
-- STEP 8 — ROW LEVEL SECURITY (CRITICAL)
-- ============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "customers_read_self" ON customers;
DROP POLICY IF EXISTS "bookings_read_own" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;
DROP POLICY IF EXISTS "owners_read_shop_bookings" ON bookings;
DROP POLICY IF EXISTS "line_accounts_read_own" ON line_accounts;

-- Customers can see themselves
CREATE POLICY "customers_read_self"
ON customers
FOR SELECT
USING (id = auth.uid());

-- Customers can see their own bookings
CREATE POLICY "bookings_read_own"
ON bookings
FOR SELECT
USING (customer_id = auth.uid());

-- Customers can create their own bookings
CREATE POLICY "bookings_insert_own"
ON bookings
FOR INSERT
WITH CHECK (customer_id = auth.uid());

-- Owners can see bookings for their shops
CREATE POLICY "owners_read_shop_bookings"
ON bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = bookings.shop_id
      AND shops.owner_id = auth.uid()
  )
);

-- Owners can update bookings for their shops
CREATE POLICY "owners_update_shop_bookings"
ON bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = bookings.shop_id
      AND shops.owner_id = auth.uid()
  )
);

-- Users can read their own line_accounts
CREATE POLICY "line_accounts_read_own"
ON line_accounts
FOR SELECT
USING (customer_id = auth.uid());

-- ============================================
-- STEP 9 — HELPER FUNCTIONS
-- ============================================

-- Function to get customer_id from LINE user_id
CREATE OR REPLACE FUNCTION get_customer_id_from_line(line_user_id_param TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_id_result UUID;
BEGIN
  SELECT la.customer_id INTO customer_id_result
  FROM line_accounts la
  WHERE la.line_user_id = line_user_id_param
  LIMIT 1;

  RETURN customer_id_result;
END;
$$;

COMMENT ON FUNCTION get_customer_id_from_line IS 'Gets customer_id from LINE user_id via line_accounts mapping';

-- ============================================
-- STEP 10 — CLEANUP OLD TABLES
-- ============================================

-- Drop old user_identities table (replaced by line_accounts)
DROP TABLE IF EXISTS user_identities CASCADE;

-- Drop old guests table (guests are now customers with role='guest')
DROP TABLE IF EXISTS guests CASCADE;

COMMENT ON TABLE customers IS 'Canonical customers table - single source of truth. All bookings reference customers.id';
COMMENT ON TABLE line_accounts IS 'Mapping table linking LINE user_id to customer_id';
COMMENT ON TABLE bookings IS 'Single bookings table for all users (LINE, web, guest). All bookings reference customers.id';


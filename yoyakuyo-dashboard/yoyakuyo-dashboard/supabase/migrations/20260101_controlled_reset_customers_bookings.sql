-- ===================
-- SAFE DROPS
-- ===================

DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- ===================
-- ENUM TYPES
-- ===================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_role') THEN
    CREATE TYPE customer_role AS ENUM ('guest', 'web', 'line');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_source_enum') THEN
    CREATE TYPE booking_source_enum AS ENUM ('guest', 'web', 'line');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_channel_enum') THEN
    CREATE TYPE booking_channel_enum AS ENUM ('guest', 'web', 'line');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_enum') THEN
    CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
  END IF;
END$$;

-- ===================
-- CUSTOMERS TABLE
-- ===================

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role customer_role NOT NULL,
  email text,
  name text,
  auth_user_id uuid UNIQUE,
  line_user_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Constraints for data integrity
  CONSTRAINT email_required_for_guest
    CHECK (role <> 'guest' OR email IS NOT NULL),
  CONSTRAINT auth_user_id_required_for_web
    CHECK (role <> 'web' OR auth_user_id IS NOT NULL),
  CONSTRAINT line_user_id_required_for_line
    CHECK (role <> 'line' OR line_user_id IS NOT NULL),
  CONSTRAINT only_guest_allows_email
    CHECK (
      (role = 'guest' AND email IS NOT NULL AND auth_user_id IS NULL AND line_user_id IS NULL)
      OR (role = 'web' AND auth_user_id IS NOT NULL AND email IS NULL AND line_user_id IS NULL)
      OR (role = 'line' AND line_user_id IS NOT NULL AND auth_user_id IS NULL AND email IS NULL)
    )
);

COMMENT ON TABLE customers IS 'Stores user data for all roles: guest, web, line. Enforces exactly one identity column per role via constraints.';

-- ===================
-- BOOKINGS TABLE
-- ===================

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id),
  service_id uuid NOT NULL REFERENCES services(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  source booking_source_enum NOT NULL,
  channel booking_channel_enum NOT NULL,
  status booking_status_enum NOT NULL DEFAULT 'pending',
  date date NOT NULL,
  start_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT channel_equals_source
    CHECK (channel = source)
);

COMMENT ON TABLE bookings IS 'Strictly references customers, shops, services. Source/channel must match customer.role in application logic.';

-- ===================
-- INDEXES
-- ===================

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_role          ON customers(role);
CREATE INDEX IF NOT EXISTS idx_customers_email         ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id  ON customers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_line_user_id  ON customers(line_user_id);

-- Bookings
CREATE INDEX IF NOT EXISTS idx_bookings_shop_id       ON bookings(shop_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id   ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status        ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_source        ON bookings(source);

-- END OF SQL


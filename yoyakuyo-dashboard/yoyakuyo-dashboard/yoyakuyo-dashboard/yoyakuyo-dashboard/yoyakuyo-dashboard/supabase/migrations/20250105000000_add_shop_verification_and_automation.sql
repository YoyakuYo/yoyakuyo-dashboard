-- ============================================================================
-- COMPREHENSIVE SHOP VERIFICATION & AUTOMATION SYSTEM
-- ============================================================================
-- This migration implements:
-- 1. Shop verification fields
-- 2. Waitlist notifications table
-- 3. Owner profiles table
-- 4. Shop settings table
-- 5. Database trigger for automatic setup on shop claim
-- ============================================================================

-- ============================================================================
-- STEP 1: Add verification fields to shops table
-- ============================================================================
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Create indexes for verification queries
CREATE INDEX IF NOT EXISTS idx_shops_is_verified ON shops(is_verified);
CREATE INDEX IF NOT EXISTS idx_shops_verification_status ON shops(verification_status);

-- ============================================================================
-- STEP 2: Create waitlist_notifications table
-- ============================================================================
CREATE TABLE IF NOT EXISTS waitlist_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_email TEXT,
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'booking_available' CHECK (notification_type IN ('booking_available', 'shop_activated')),
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_shop_id ON waitlist_notifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_customer_email ON waitlist_notifications(customer_email);
CREATE INDEX IF NOT EXISTS idx_waitlist_customer_id ON waitlist_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_notified ON waitlist_notifications(notified);

-- ============================================================================
-- STEP 3: Create owner_profiles table
-- ============================================================================
CREATE TABLE IF NOT EXISTS owner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_profiles_owner_user_id ON owner_profiles(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_owner_profiles_shop_id ON owner_profiles(shop_id);

-- ============================================================================
-- STEP 4: Create shop_settings table
-- ============================================================================
CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
  -- Working hours (stored as JSONB for flexibility)
  -- Format: {"monday": {"open": "09:00", "close": "18:00"}, ...}
  working_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "18:00"},
    "tuesday": {"open": "09:00", "close": "18:00"},
    "wednesday": {"open": "09:00", "close": "18:00"},
    "thursday": {"open": "09:00", "close": "18:00"},
    "friday": {"open": "09:00", "close": "18:00"},
    "saturday": {"open": "09:00", "close": "18:00"},
    "sunday": {"open": null, "close": null}
  }'::jsonb,
  -- Closed days (array of day names)
  closed_days TEXT[] DEFAULT ARRAY['sunday'],
  -- Buffer time between bookings (in minutes)
  buffer_time_minutes INTEGER DEFAULT 15,
  -- Auto-confirm bookings
  auto_confirm_bookings BOOLEAN DEFAULT FALSE,
  -- AI configuration
  ai_enabled BOOLEAN DEFAULT TRUE,
  ai_auto_reply BOOLEAN DEFAULT FALSE,
  -- Notification preferences
  notify_new_booking BOOLEAN DEFAULT TRUE,
  notify_booking_cancellation BOOLEAN DEFAULT TRUE,
  notify_new_message BOOLEAN DEFAULT TRUE,
  -- Calendar settings
  calendar_sync_enabled BOOLEAN DEFAULT FALSE,
  calendar_provider TEXT, -- 'google', 'outlook', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_id ON shop_settings(shop_id);

-- ============================================================================
-- STEP 5: Create trigger function for automatic shop setup on claim
-- ============================================================================
CREATE OR REPLACE FUNCTION on_shop_claim()
RETURNS TRIGGER AS $$
DECLARE
  owner_email TEXT;
  owner_name TEXT;
BEGIN
  -- Only trigger when owner_user_id changes from NULL to a value
  IF NEW.owner_user_id IS NOT NULL AND (OLD.owner_user_id IS NULL OR OLD.owner_user_id != NEW.owner_user_id) THEN
    
    -- Get owner email and name from users table
    SELECT email, COALESCE(name, '') INTO owner_email, owner_name
    FROM public.users
    WHERE id = NEW.owner_user_id
    LIMIT 1;
    
    -- 1. Create or update owner profile
    INSERT INTO owner_profiles (owner_user_id, shop_id, email, name)
    VALUES (NEW.owner_user_id, NEW.id, owner_email, owner_name)
    ON CONFLICT (owner_user_id) 
    DO UPDATE SET 
      shop_id = NEW.id,
      updated_at = NOW();
    
    -- 2. Create default shop settings if they don't exist
    INSERT INTO shop_settings (shop_id)
    VALUES (NEW.id)
    ON CONFLICT (shop_id) DO NOTHING;
    
    -- 3. Set default opening hours on shops table if not set
    IF NEW.opening_hours IS NULL THEN
      UPDATE shops
      SET opening_hours = '{
        "monday": {"open": "09:00", "close": "18:00"},
        "tuesday": {"open": "09:00", "close": "18:00"},
        "wednesday": {"open": "09:00", "close": "18:00"},
        "thursday": {"open": "09:00", "close": "18:00"},
        "friday": {"open": "09:00", "close": "18:00"},
        "saturday": {"open": "09:00", "close": "18:00"},
        "sunday": {"open": null, "close": null}
      }'::jsonb
      WHERE id = NEW.id;
    END IF;
    
    -- 4. Notify all users in waitlist that booking is now available
    UPDATE waitlist_notifications
    SET 
      notified = TRUE,
      notified_at = NOW(),
      updated_at = NOW()
    WHERE shop_id = NEW.id 
      AND notified = FALSE
      AND notification_type = 'booking_available';
    
    -- Create notifications for waitlisted users
    INSERT INTO notifications (recipient_type, recipient_id, type, title, body, data, is_read)
    SELECT 
      CASE 
        WHEN customer_id IS NOT NULL THEN 'customer'
        ELSE 'guest'
      END,
      COALESCE(customer_id::TEXT, customer_email) AS recipient_id,
      'shop_activated' AS type,
      'Shop Booking Now Available' AS title,
      'The shop "' || (SELECT name FROM shops WHERE id = NEW.id) || '" has activated online booking!' AS body,
      jsonb_build_object('shop_id', NEW.id, 'shop_name', (SELECT name FROM shops WHERE id = NEW.id)) AS data,
      FALSE AS is_read
    FROM waitlist_notifications
    WHERE shop_id = NEW.id 
      AND notified = TRUE
      AND notified_at = NOW(); -- Only for just-notified records
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_on_shop_claim ON shops;
CREATE TRIGGER trigger_on_shop_claim
  AFTER UPDATE OF owner_user_id ON shops
  FOR EACH ROW
  EXECUTE FUNCTION on_shop_claim();

-- ============================================================================
-- STEP 6: Add RLS policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE waitlist_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- waitlist_notifications policies
CREATE POLICY "Users can view their own waitlist entries"
  ON waitlist_notifications FOR SELECT
  USING (
    customer_id IN (SELECT id FROM customer_profiles WHERE id = auth.uid())
    OR customer_email IN (SELECT email FROM public.users WHERE id = auth.uid())
    OR customer_email IN (SELECT email FROM customer_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create their own waitlist entries"
  ON waitlist_notifications FOR INSERT
  WITH CHECK (
    customer_id IN (SELECT id FROM customer_profiles WHERE id = auth.uid())
    OR customer_email IS NOT NULL
  );

-- owner_profiles policies
CREATE POLICY "Owners can view their own profile"
  ON owner_profiles FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY "Owners can update their own profile"
  ON owner_profiles FOR UPDATE
  USING (owner_user_id = auth.uid());

-- shop_settings policies
CREATE POLICY "Owners can view their shop settings"
  ON shop_settings FOR SELECT
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can update their shop settings"
  ON shop_settings FOR UPDATE
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
  );

-- ============================================================================
-- STEP 7: Add comments for documentation
-- ============================================================================
COMMENT ON TABLE waitlist_notifications IS 'Stores users who want to be notified when a shop activates booking';
COMMENT ON TABLE owner_profiles IS 'Extended profile information for shop owners';
COMMENT ON TABLE shop_settings IS 'Shop-specific settings including working hours, AI config, and notifications';
COMMENT ON FUNCTION on_shop_claim() IS 'Automatically sets up shop when claimed: creates owner profile, shop settings, and notifies waitlisted users';


-- ============================================================
-- FIX: on_shop_claim trigger function references 'name' column
-- ============================================================
-- Problem: The trigger function on_shop_claim() references shops.name
-- but the column might not exist or be named differently
-- ============================================================

-- Step 1: CREATE shops.name column (guaranteed)
DO $$
BEGIN
  -- Add the column if it doesn't exist
  ALTER TABLE shops ADD COLUMN IF NOT EXISTS name TEXT;
  
  -- Set default empty string for all NULL values
  UPDATE shops SET name = '' WHERE name IS NULL;
  
  -- Set default and make NOT NULL
  ALTER TABLE shops ALTER COLUMN name SET DEFAULT '';
  ALTER TABLE shops ALTER COLUMN name SET NOT NULL;
  
  RAISE NOTICE '✅ shops.name column created and set to NOT NULL';
END $$;

-- Step 2: Fix the on_shop_claim trigger function to handle missing name gracefully
CREATE OR REPLACE FUNCTION on_shop_claim()
RETURNS TRIGGER AS $$
DECLARE
  owner_email TEXT;
  owner_name TEXT;
  shop_name_value TEXT;
BEGIN
  -- Only trigger when owner_user_id changes from NULL to a value
  IF NEW.owner_user_id IS NOT NULL AND (OLD.owner_user_id IS NULL OR OLD.owner_user_id != NEW.owner_user_id) THEN
    
    -- Get owner email and name from users table
    SELECT email, COALESCE(full_name, '') INTO owner_email, owner_name
    FROM public.users
    WHERE id = NEW.owner_user_id
    LIMIT 1;
    
    -- Get shop name safely (handle if column doesn't exist)
    BEGIN
      SELECT COALESCE(name, '') INTO shop_name_value FROM shops WHERE id = NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        shop_name_value := '';
    END;
    
    -- 1. Create or update owner profile (using owner_profiles table structure)
    -- Note: owner_profiles.id references auth.users(id), not users.id
    INSERT INTO owner_profiles (id, full_name, country, address_line1, city, prefecture, company_phone, company_email)
    VALUES (
      NEW.owner_user_id,
      COALESCE(owner_name, ''),
      '',
      '',
      '',
      '',
      '',
      COALESCE(owner_email, '')
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
      company_email = COALESCE(owner_email, owner_profiles.company_email),
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
    
    -- 5. Create notifications for waitlisted users (only if notifications table exists)
    -- Use shop_name_value safely (empty string if name doesn't exist)
    BEGIN
      INSERT INTO notifications (recipient_type, recipient_id, type, title, body, data, is_read)
      SELECT 
        CASE 
          WHEN customer_id IS NOT NULL THEN 'customer'
          ELSE 'guest'
        END,
        COALESCE(customer_id::TEXT, customer_email) AS recipient_id,
        'shop_activated' AS type,
        'Shop Booking Now Available' AS title,
        'The shop "' || COALESCE(shop_name_value, '') || '" has activated online booking!' AS body,
        jsonb_build_object('shop_id', NEW.id, 'shop_name', COALESCE(shop_name_value, '')) AS data,
        FALSE AS is_read
      FROM waitlist_notifications
      WHERE shop_id = NEW.id 
        AND notified = TRUE
        AND notified_at = NOW(); -- Only for just-notified records
    EXCEPTION
      WHEN undefined_table THEN
        -- notifications table doesn't exist, skip
        NULL;
      WHEN OTHERS THEN
        -- Other error, log but don't fail
        RAISE WARNING 'Error creating notifications: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Verify the function was updated
SELECT 
  'Trigger Function Updated' AS status,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'on_shop_claim';


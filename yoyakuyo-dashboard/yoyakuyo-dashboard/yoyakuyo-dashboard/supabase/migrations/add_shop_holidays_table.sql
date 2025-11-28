-- Migration: Create shop_holidays table for calendar management
-- Allows owners to mark dates as holidays/unavailable in any language

CREATE TABLE IF NOT EXISTS shop_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    reason TEXT, -- Optional reason for the holiday (in owner's language)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shop_id, holiday_date) -- Prevent duplicate holidays for same shop/date
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS shop_holidays_shop_id_idx ON shop_holidays(shop_id);
CREATE INDEX IF NOT EXISTS shop_holidays_date_idx ON shop_holidays(holiday_date);
CREATE INDEX IF NOT EXISTS shop_holidays_shop_date_idx ON shop_holidays(shop_id, holiday_date);

-- Add comment
COMMENT ON TABLE shop_holidays IS 'Stores holidays/unavailable dates for shops - managed via multilingual AI commands';


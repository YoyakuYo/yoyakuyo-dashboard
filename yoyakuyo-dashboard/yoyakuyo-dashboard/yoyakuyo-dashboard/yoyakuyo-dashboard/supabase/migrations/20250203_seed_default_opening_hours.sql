-- Seed default opening hours for shops without opening_hours
-- Default: Mon-Sun 10:00-19:00 JST

UPDATE shops
SET opening_hours = '{
  "monday": {"open": "10:00", "close": "19:00"},
  "tuesday": {"open": "10:00", "close": "19:00"},
  "wednesday": {"open": "10:00", "close": "19:00"},
  "thursday": {"open": "10:00", "close": "19:00"},
  "friday": {"open": "10:00", "close": "19:00"},
  "saturday": {"open": "10:00", "close": "19:00"},
  "sunday": {"open": "10:00", "close": "19:00"}
}'::jsonb
WHERE opening_hours IS NULL OR opening_hours = 'null'::jsonb;


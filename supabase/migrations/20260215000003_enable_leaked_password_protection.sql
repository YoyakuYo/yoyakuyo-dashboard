-- Enable leaked password protection in Supabase Auth
-- This prevents users from using passwords that have been found in data breaches

-- Note: This setting needs to be configured in the Supabase dashboard or via API
-- The migration serves as documentation of the security requirement

-- To enable leaked password protection:
-- 1. Go to Supabase Dashboard > Authentication > Settings
-- 2. Enable "Leaked password protection"
-- 3. This will check passwords against HaveIBeenPwned.org

-- This migration cannot directly enable the feature as it's a Supabase Auth setting,
-- but it documents the security requirement and can be used to verify the setting.

DO $$
BEGIN
    RAISE NOTICE 'Leaked password protection should be enabled in Supabase Auth settings';
    RAISE NOTICE 'Go to: Supabase Dashboard > Authentication > Settings > Leaked password protection';
    RAISE NOTICE 'This prevents users from using compromised passwords from data breaches';
END $$;

COMMENT ON DATABASE CURRENT_DATABASE IS 'Leaked password protection should be enabled in Supabase Auth settings to prevent use of compromised passwords';
-- ============================================
-- FIX CUSTOMER IDENTITY TRIGGER FOR NEW ARCHITECTURE
-- ============================================
-- Update the customer identity trigger to allow customers without auth.users entries
-- since LINE users now use service role access instead of JWT authentication

-- Drop the restrictive trigger that requires auth.users entries
DROP TRIGGER IF EXISTS customer_identity_guard ON public.customers;
DROP FUNCTION IF EXISTS public.enforce_customer_identity();

-- Create a more permissive trigger that only validates when we can check auth.users
CREATE OR REPLACE FUNCTION public.enforce_customer_identity()
RETURNS trigger AS $$
BEGIN
  -- For customers/owners, try to validate auth.users exists, but don't fail if we can't check
  -- This allows LINE users (who don't need auth.users entries) while still validating web users
  IF NEW.role IN ('customer', 'owner') THEN
    BEGIN
      -- Try to check auth.users, but don't fail if the table isn't accessible
      -- This allows the system to work even if auth.users access is restricted
      IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = NEW.id) THEN
        -- Log a warning but don't block the insert
        -- This allows LINE users to work while still warning about missing auth.users
        RAISE WARNING 'Customer % (role=%) has no matching auth.users entry. This is OK for LINE users but may indicate an issue for web users.', NEW.id, NEW.role;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If we can't access auth.users (schema cache issues, permissions, etc.)
      -- Just log and allow the insert to proceed
      RAISE WARNING 'Could not validate auth.users entry for customer % (role=%). Allowing insert to proceed.', NEW.id, NEW.role;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the more permissive function
CREATE TRIGGER customer_identity_guard
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.enforce_customer_identity();

-- ============================================
-- UPDATE SCHEMA CACHE
-- ============================================
-- Force refresh of PostgREST schema cache to pick up changes
NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION public.enforce_customer_identity() IS 'Permissive customer identity validation that allows customers without auth.users entries (for LINE users) while warning about potential issues.';

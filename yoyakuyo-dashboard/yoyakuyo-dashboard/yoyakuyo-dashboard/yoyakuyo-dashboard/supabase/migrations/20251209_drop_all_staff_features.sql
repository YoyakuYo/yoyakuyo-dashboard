-- DROP STAFF TABLES (SAFE)
DROP TABLE IF EXISTS staff_messages CASCADE;
DROP TABLE IF EXISTS staff_assignments CASCADE;
DROP TABLE IF EXISTS staff_shops CASCADE;
DROP TABLE IF EXISTS staff_profiles CASCADE;
DROP TABLE IF EXISTS staff_roles CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

-- DROP STAFF FUNCTIONS
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT proname, oid::regprocedure::text AS signature
    FROM pg_proc
    WHERE proname ILIKE '%staff%'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE;', r.signature);
  END LOOP;
END$$;

-- DROP STAFF POLICIES
DO $$
DECLARE r RECORD;
BEGIN
  -- Drop policies by name only (pg_policies view)
  FOR r IN
    SELECT policyname, schemaname, tablename
    FROM pg_policies
    WHERE policyname ILIKE '%staff%'
  LOOP
    BEGIN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I.%I;',
        r.policyname, r.schemaname, r.tablename
      );
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors if policy doesn't exist or table is already dropped
      NULL;
    END;
  END LOOP;
END$$;

-- REMOVE STAFF ROLES (if auth.roles table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'roles') THEN
    DELETE FROM auth.roles WHERE role ILIKE '%staff%';
  END IF;
END$$;

-- Fix pg_trgm extension schema issue
-- Move pg_trgm extension from public schema to extensions schema

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm extension to extensions schema
-- First, we need to drop and recreate the extension in the correct schema
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION pg_trgm SCHEMA extensions;

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams (moved to extensions schema for security)';
-- Check what values are valid for customer role enum
SELECT enum_range(NULL::customer_role);

-- Or check by looking at existing customers
SELECT DISTINCT role FROM customers ORDER BY role;

-- Check what the actual enum type is called
SELECT
  t.typname,
  e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%role%'
ORDER BY t.typname, e.enumlabel;
-- Fix LINE customer roles and data integrity
-- Update existing LINE customers to have correct role and line_user_id

-- First, drop the customer_single_identity constraint if it exists
-- This constraint may prevent customers from having multiple identities
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customer_single_identity'
        AND conrelid = 'public.customers'::regclass
    ) THEN
        -- Drop the constraint that's preventing the update
        ALTER TABLE public.customers DROP CONSTRAINT customer_single_identity;
        RAISE NOTICE 'Dropped customer_single_identity constraint to allow multiple identities';
    END IF;
END $$;

-- 1. Update customers table for LINE users (only set line_user_id, keep existing role)
UPDATE customers
SET line_user_id = la.line_user_id
FROM line_accounts la
WHERE customers.id = la.customer_id
AND customers.line_user_id IS NULL;

-- 2. For customers that need role='line' but have different role, update carefully
-- Only change role if the customer ONLY has LINE identity (no web auth)
UPDATE customers
SET role = 'line'
FROM line_accounts la
WHERE customers.id = la.customer_id
AND customers.role != 'line'
AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = customers.id
);

-- 3. Log the changes
SELECT 'LINE CUSTOMERS UPDATED' as action,
       COUNT(*) as total_line_accounts,
       COUNT(CASE WHEN c.role = 'line' THEN 1 END) as line_role_customers,
       COUNT(CASE WHEN c.line_user_id IS NOT NULL THEN 1 END) as customers_with_line_user_id
FROM customers c
INNER JOIN line_accounts la ON c.id = la.customer_id;

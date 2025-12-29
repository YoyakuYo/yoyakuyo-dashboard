/* Query to check shops missing city data */

-- Overview: Count shops missing city, filtered for visible ones (e.g., claim_status != 'hidden')
SELECT 
    'Total visible shops missing city' AS metric,
    COUNT(*)::text AS count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
    AND (city IS NULL OR city = '');

-- Breakdown: Missing city by other factors (e.g., has address or prefecture)
SELECT 
    'Missing city but has address' AS metric,
    COUNT(*)::text AS count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
    AND city IS NULL AND address IS NOT NULL;

SELECT 
    'Missing city but has prefecture' AS metric,
    COUNT(*)::text AS count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
    AND city IS NULL AND prefecture IS NOT NULL;

-- Add more as needed, e.g., missing city and verified shops
SELECT 
    'Missing city in verified shops' AS metric,
    COUNT(*)::text AS count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
    AND city IS NULL AND is_verified = TRUE;

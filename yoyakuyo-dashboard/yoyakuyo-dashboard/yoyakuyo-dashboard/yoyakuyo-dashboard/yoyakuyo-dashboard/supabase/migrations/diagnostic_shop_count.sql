-- Diagnostic: Complete Shop Count Analysis
-- Run this in Supabase SQL Editor or via CLI

-- 1. Total shop count
SELECT 
    'Total Shops' as metric,
    COUNT(*) as count
FROM shops;

-- 2. Shops by claim_status
SELECT 
    COALESCE(claim_status, 'null') as claim_status,
    COUNT(*) as count
FROM shops
GROUP BY claim_status
ORDER BY count DESC;

-- 3. Shops by category_id (with category names)
SELECT 
    COALESCE(c.name, 'No Category') as category_name,
    COUNT(s.id) as shop_count
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
GROUP BY c.name
ORDER BY shop_count DESC;

-- 4. Visible shops (not hidden)
SELECT 
    'Visible Shops (not hidden)' as metric,
    COUNT(*) as count
FROM shops
WHERE claim_status IS NULL OR claim_status != 'hidden';

-- 5. Shops with owner vs unclaimed
SELECT 
    CASE 
        WHEN owner_user_id IS NULL THEN 'Unclaimed'
        ELSE 'Claimed'
    END as ownership_status,
    COUNT(*) as count
FROM shops
GROUP BY 
    CASE 
        WHEN owner_user_id IS NULL THEN 'Unclaimed'
        ELSE 'Claimed'
    END;

-- 6. Summary table
SELECT 
    (SELECT COUNT(*) FROM shops) as total_shops,
    (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden') as visible_shops,
    (SELECT COUNT(*) FROM shops WHERE owner_user_id IS NOT NULL) as claimed_shops,
    (SELECT COUNT(*) FROM shops WHERE owner_user_id IS NULL) as unclaimed_shops,
    (SELECT COUNT(*) FROM shops WHERE category_id IS NOT NULL) as categorized_shops,
    (SELECT COUNT(*) FROM shops WHERE category_id IS NULL) as uncategorized_shops;


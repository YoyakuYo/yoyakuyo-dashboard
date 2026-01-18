-- ============================================================================
-- CATEGORIZE UNKNOWN SHOPS
-- ============================================================================
-- This query helps identify and categorize the 914 "Unknown" shops
-- that are visible in the LINE app
-- ============================================================================

-- 1. Sample Unknown shops (to see what they are)
SELECT 
  'Sample Unknown Shops' as query_type,
  s.id,
  s.name,
  s.address,
  s.subcategory,
  s.claim_status,
  -- Try to infer category from name
  CASE 
    WHEN LOWER(s.name) LIKE '%restaurant%' OR LOWER(s.name) LIKE '%dining%' OR LOWER(s.name) LIKE '%cafe%' OR LOWER(s.name) LIKE '%レストラン%' OR LOWER(s.name) LIKE '%カフェ%' THEN 'Restaurant'
    WHEN LOWER(s.name) LIKE '%dental%' OR LOWER(s.name) LIKE '%歯科%' OR LOWER(s.name) LIKE '%歯医者%' THEN 'Dental Clinic'
    WHEN LOWER(s.name) LIKE '%hotel%' OR LOWER(s.name) LIKE '%ホテル%' THEN 'Hotel'
    WHEN LOWER(s.name) LIKE '%hair%' OR LOWER(s.name) LIKE '%salon%' OR LOWER(s.name) LIKE '%ヘア%' OR LOWER(s.name) LIKE '%サロン%' THEN 'Hair Salon'
    WHEN LOWER(s.name) LIKE '%nail%' OR LOWER(s.name) LIKE '%manicure%' OR LOWER(s.name) LIKE '%ネイル%' THEN 'Nail Salon'
    WHEN LOWER(s.name) LIKE '%barber%' OR LOWER(s.name) LIKE '%理容%' THEN 'Barbershop'
    WHEN LOWER(s.name) LIKE '%spa%' OR LOWER(s.name) LIKE '%スパ%' THEN 'Spa'
    WHEN LOWER(s.name) LIKE '%onsen%' OR LOWER(s.name) LIKE '%温泉%' THEN 'Onsen'
    WHEN LOWER(s.name) LIKE '%massage%' OR LOWER(s.name) LIKE '%マッサージ%' THEN 'Massages'
    WHEN LOWER(s.name) LIKE '%izakaya%' OR LOWER(s.name) LIKE '%居酒屋%' THEN 'Izakaya'
    WHEN LOWER(s.name) LIKE '%clinic%' OR LOWER(s.name) LIKE '%クリニック%' THEN 'Dental Clinic'
    WHEN LOWER(s.name) LIKE '%eye%' OR LOWER(s.name) LIKE '%眼科%' THEN 'Eye Clinic'
    WHEN LOWER(s.name) LIKE '%golf%' OR LOWER(s.name) LIKE '%ゴルフ%' THEN 'Golf'
    WHEN LOWER(s.name) LIKE '%karaoke%' OR LOWER(s.name) LIKE '%カラオケ%' THEN 'Karaoke'
    ELSE 'Unknown'
  END as suggested_category
FROM shops s
WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
  AND s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
  AND s.claim_status != 'hidden'
LIMIT 50;

-- 2. Count Unknown shops by suggested category
SELECT 
  'Unknown Shops by Suggested Category' as query_type,
  CASE 
    WHEN LOWER(s.name) LIKE '%restaurant%' OR LOWER(s.name) LIKE '%dining%' OR LOWER(s.name) LIKE '%cafe%' OR LOWER(s.name) LIKE '%レストラン%' OR LOWER(s.name) LIKE '%カフェ%' THEN 'Restaurant'
    WHEN LOWER(s.name) LIKE '%dental%' OR LOWER(s.name) LIKE '%歯科%' OR LOWER(s.name) LIKE '%歯医者%' THEN 'Dental Clinic'
    WHEN LOWER(s.name) LIKE '%hotel%' OR LOWER(s.name) LIKE '%ホテル%' THEN 'Hotel'
    WHEN LOWER(s.name) LIKE '%hair%' OR LOWER(s.name) LIKE '%salon%' OR LOWER(s.name) LIKE '%ヘア%' OR LOWER(s.name) LIKE '%サロン%' THEN 'Hair Salon'
    WHEN LOWER(s.name) LIKE '%nail%' OR LOWER(s.name) LIKE '%manicure%' OR LOWER(s.name) LIKE '%ネイル%' THEN 'Nail Salon'
    WHEN LOWER(s.name) LIKE '%barber%' OR LOWER(s.name) LIKE '%理容%' THEN 'Barbershop'
    WHEN LOWER(s.name) LIKE '%spa%' OR LOWER(s.name) LIKE '%スパ%' THEN 'Spa'
    WHEN LOWER(s.name) LIKE '%onsen%' OR LOWER(s.name) LIKE '%温泉%' THEN 'Onsen'
    WHEN LOWER(s.name) LIKE '%massage%' OR LOWER(s.name) LIKE '%マッサージ%' THEN 'Massages'
    WHEN LOWER(s.name) LIKE '%izakaya%' OR LOWER(s.name) LIKE '%居酒屋%' THEN 'Izakaya'
    WHEN LOWER(s.name) LIKE '%clinic%' OR LOWER(s.name) LIKE '%クリニック%' THEN 'Dental Clinic'
    WHEN LOWER(s.name) LIKE '%eye%' OR LOWER(s.name) LIKE '%眼科%' THEN 'Eye Clinic'
    WHEN LOWER(s.name) LIKE '%golf%' OR LOWER(s.name) LIKE '%ゴルフ%' THEN 'Golf'
    WHEN LOWER(s.name) LIKE '%karaoke%' OR LOWER(s.name) LIKE '%カラオケ%' THEN 'Karaoke'
    ELSE 'Cannot Determine'
  END as suggested_category,
  COUNT(*) as count
FROM shops s
WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
  AND s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
  AND s.claim_status != 'hidden'
GROUP BY 
  CASE 
    WHEN LOWER(s.name) LIKE '%restaurant%' OR LOWER(s.name) LIKE '%dining%' OR LOWER(s.name) LIKE '%cafe%' OR LOWER(s.name) LIKE '%レストラン%' OR LOWER(s.name) LIKE '%カフェ%' THEN 'Restaurant'
    WHEN LOWER(s.name) LIKE '%dental%' OR LOWER(s.name) LIKE '%歯科%' OR LOWER(s.name) LIKE '%歯医者%' THEN 'Dental Clinic'
    WHEN LOWER(s.name) LIKE '%hotel%' OR LOWER(s.name) LIKE '%ホテル%' THEN 'Hotel'
    WHEN LOWER(s.name) LIKE '%hair%' OR LOWER(s.name) LIKE '%salon%' OR LOWER(s.name) LIKE '%ヘア%' OR LOWER(s.name) LIKE '%サロン%' THEN 'Hair Salon'
    WHEN LOWER(s.name) LIKE '%nail%' OR LOWER(s.name) LIKE '%manicure%' OR LOWER(s.name) LIKE '%ネイル%' THEN 'Nail Salon'
    WHEN LOWER(s.name) LIKE '%barber%' OR LOWER(s.name) LIKE '%理容%' THEN 'Barbershop'
    WHEN LOWER(s.name) LIKE '%spa%' OR LOWER(s.name) LIKE '%スパ%' THEN 'Spa'
    WHEN LOWER(s.name) LIKE '%onsen%' OR LOWER(s.name) LIKE '%温泉%' THEN 'Onsen'
    WHEN LOWER(s.name) LIKE '%massage%' OR LOWER(s.name) LIKE '%マッサージ%' THEN 'Massages'
    WHEN LOWER(s.name) LIKE '%izakaya%' OR LOWER(s.name) LIKE '%居酒屋%' THEN 'Izakaya'
    WHEN LOWER(s.name) LIKE '%clinic%' OR LOWER(s.name) LIKE '%クリニック%' THEN 'Dental Clinic'
    WHEN LOWER(s.name) LIKE '%eye%' OR LOWER(s.name) LIKE '%眼科%' THEN 'Eye Clinic'
    WHEN LOWER(s.name) LIKE '%golf%' OR LOWER(s.name) LIKE '%ゴルフ%' THEN 'Golf'
    WHEN LOWER(s.name) LIKE '%karaoke%' OR LOWER(s.name) LIKE '%カラオケ%' THEN 'Karaoke'
    ELSE 'Cannot Determine'
  END
ORDER BY count DESC;

-- 3. Check if Unknown shops have subcategory field
SELECT 
  'Unknown Shops with Subcategory Field' as query_type,
  CASE 
    WHEN s.subcategory IS NOT NULL AND s.subcategory != '' THEN 'Has Subcategory'
    ELSE 'No Subcategory'
  END as has_subcategory,
  COUNT(*) as count
FROM shops s
WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
  AND s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
  AND s.claim_status != 'hidden'
GROUP BY 
  CASE 
    WHEN s.subcategory IS NOT NULL AND s.subcategory != '' THEN 'Has Subcategory'
    ELSE 'No Subcategory'
  END;

-- 4. Sample Unknown shops WITH subcategory (these should be easy to fix)
SELECT 
  'Unknown Shops WITH Subcategory (Easy to Fix)' as query_type,
  s.name,
  s.subcategory,
  s.address
FROM shops s
WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
  AND s.subcategory IS NOT NULL 
  AND s.subcategory != ''
  AND s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
  AND s.claim_status != 'hidden'
LIMIT 20;


-- ============================================
-- SAMPLE SHOP DATA FOR TESTING
-- ============================================
-- Example data format for dental clinics and hotels
-- Replace with real data from legal sources

-- Sample dental clinics (Tokyo area)
INSERT INTO shop_imports (
    name, category, postal_code, prefecture, city, street_address,
    phone, website, latitude, longitude, source
) VALUES
('東京デンタルクリニック', 'dental_clinic', '100-0001', '東京都', '千代田区', '丸の内1-1-1', '03-1234-5678', 'https://tokyo-dental.example.com', 35.6812, 139.7671, 'sample_data'),
('渋谷デンタルオフィス', 'dental_clinic', '150-0002', '東京都', '渋谷区', '渋谷2-2-2', '03-2345-6789', 'https://shibuya-dental.example.com', 35.6580, 139.7016, 'sample_data'),
('品川デンタルセンター', 'dental_clinic', '140-0001', '東京都', '品川区', '品川3-3-3', '03-3456-7890', 'https://shinagawa-dental.example.com', 35.6284, 139.7388, 'sample_data');

-- Sample hotels (Tokyo area)
INSERT INTO shop_imports (
    name, category, postal_code, prefecture, city, street_address,
    phone, website, latitude, longitude, source
) VALUES
('東京グランドホテル', 'hotel', '100-0004', '東京都', '千代田区', '大手町1-1-1', '03-1234-0001', 'https://tokyo-grand.example.com', 35.6850, 139.7514, 'sample_data'),
('渋谷ビジネスホテル', 'hotel', '150-0041', '東京都', '渋谷区', '神南1-1-1', '03-2345-0002', 'https://shibuya-business.example.com', 35.6620, 139.6992, 'sample_data'),
('品川シティホテル', 'hotel', '108-0074', '東京都', '港区', '高輪3-1-1', '03-3456-0003', 'https://shinagawa-city.example.com', 35.6284, 139.7388, 'sample_data');

-- ============================================
-- LEGAL DATA SOURCES FOR JAPAN
-- ============================================
-- Use these public sources for real shop data:

-- 1. OpenStreetMap (OSM) Data
-- Download Japan OSM data and extract business POIs
-- URL: https://download.geofabrik.de/asia/japan.html
-- Filter for amenity=dentist and tourism=hotel

-- 2. Japanese Government Open Data
-- Ministry of Health POI data (includes dental clinics)
-- URL: https://www.data.go.jp/
-- Search for "医療機関" (medical facilities)

-- 3. Local Government Data
-- Many prefectures publish business registries
-- Example: Tokyo Metropolitan Government Open Data
-- URL: https://portal.data.metro.tokyo.lg.jp/

-- 4. Yellow Pages / Business Directories
-- Public business listing data (check terms of use)
-- Some provide CSV exports of business data

-- 5. Wikidata
-- Structured data for businesses
-- Query for Japanese dental clinics and hotels
-- URL: https://www.wikidata.org/

-- ============================================
-- BULK IMPORT EXAMPLE
-- ============================================
-- Example of how to bulk import from JSON array:

-- SELECT * FROM bulk_import_shops(ARRAY[
--     '{"name": "大阪デンタルクリニック", "category": "dental_clinic", "postal_code": "530-0001", "prefecture": "大阪府", "city": "大阪市北区", "street_address": "梅田1-1-1", "phone": "06-1234-5678", "source": "government_data"}'::jsonb,
--     '{"name": "京都ホテル", "category": "hotel", "postal_code": "600-0001", "prefecture": "京都府", "city": "京都市下京区", "street_address": "河原町1-1-1", "phone": "075-123-4567", "source": "openstreetmap"}'::jsonb
-- ]);

-- Then run: SELECT * FROM import_shop_data();

-- ============================================
-- MONITORING QUERIES
-- ============================================

-- Check import status
-- SELECT * FROM shop_import_status;

-- Check newly imported shops
-- SELECT name, category, prefecture, city, created_at
-- FROM shops
-- WHERE created_at > NOW() - INTERVAL '1 hour'
-- ORDER BY created_at DESC;

-- Validate addresses
-- SELECT name, address, postal_code, prefecture, city, street_address
-- FROM shops
-- WHERE category IN ('dental', 'hotel')
-- ORDER BY prefecture, city;

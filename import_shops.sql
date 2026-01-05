-- ============================================
-- SHOP DATA IMPORT SYSTEM
-- ============================================
-- Legal import of dental clinics and hotels across Japan
-- Ensures full addresses and proper data validation

-- 1. CREATE IMPORT TABLE FOR STAGING
CREATE TABLE IF NOT EXISTS shop_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('dental_clinic', 'hotel', 'other')),
    address TEXT NOT NULL,
    postal_code TEXT,
    prefecture TEXT NOT NULL,
    city TEXT NOT NULL,
    street_address TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    source TEXT NOT NULL, -- e.g., 'government_data', 'openstreetmap', 'manual_entry'
    source_id TEXT, -- ID from source system
    imported_at TIMESTAMPTZ DEFAULT now(),
    processed BOOLEAN DEFAULT false,
    error_message TEXT
);

-- 2. VALIDATION FUNCTION FOR COMPLETE ADDRESSES
CREATE OR REPLACE FUNCTION validate_japanese_address(
    postal_code TEXT,
    prefecture TEXT,
    city TEXT,
    street_address TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if all required address components are present and non-empty
    IF postal_code IS NULL OR trim(postal_code) = '' THEN RETURN false; END IF;
    IF prefecture IS NULL OR trim(prefecture) = '' THEN RETURN false; END IF;
    IF city IS NULL OR trim(city) = '' THEN RETURN false; END IF;
    IF street_address IS NULL OR trim(street_address) = '' THEN RETURN false; END IF;

    -- Validate postal code format (Japanese: 123-4567)
    IF NOT (postal_code ~ '^\d{3}-\d{4}$') THEN RETURN false; END IF;

    -- Check for valid Japanese prefectures
    IF prefecture NOT IN (
        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ) THEN RETURN false; END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 3. IMPORT FUNCTION WITH VALIDATION
CREATE OR REPLACE FUNCTION import_shop_data() RETURNS TABLE(
    imported_count INTEGER,
    skipped_count INTEGER,
    error_count INTEGER
) AS $$
DECLARE
    import_record RECORD;
    imported_cnt INTEGER := 0;
    skipped_cnt INTEGER := 0;
    error_cnt INTEGER := 0;
    owner_user_id UUID;
BEGIN
    -- Get a default owner (you can modify this logic)
    SELECT id INTO owner_user_id
    FROM auth.users
    WHERE email = 'admin@yoyakuyo.com'  -- Replace with your admin email
    LIMIT 1;

    IF owner_user_id IS NULL THEN
        RAISE EXCEPTION 'No admin user found for shop ownership';
    END IF;

    -- Process each import record
    FOR import_record IN
        SELECT * FROM shop_imports
        WHERE processed = false
        ORDER BY imported_at
    LOOP
        BEGIN
            -- Validate address completeness
            IF NOT validate_japanese_address(
                import_record.postal_code,
                import_record.prefecture,
                import_record.city,
                import_record.street_address
            ) THEN
                UPDATE shop_imports
                SET processed = true,
                    error_message = 'Incomplete or invalid Japanese address'
                WHERE id = import_record.id;

                error_cnt := error_cnt + 1;
                CONTINUE;
            END IF;

            -- Check for duplicate shops (same name + address)
            IF EXISTS (
                SELECT 1 FROM shops
                WHERE name = import_record.name
                AND address = import_record.address
            ) THEN
                UPDATE shop_imports
                SET processed = true,
                    error_message = 'Duplicate shop (same name and address)'
                WHERE id = import_record.id;

                skipped_cnt := skipped_cnt + 1;
                CONTINUE;
            END IF;

            -- Insert the shop
            INSERT INTO shops (
                name,
                address,
                phone,
                website,
                latitude,
                longitude,
                owner_user_id,
                category,
                postal_code,
                prefecture,
                city,
                street_address
            ) VALUES (
                import_record.name,
                trim(import_record.prefecture || import_record.city || import_record.street_address),
                import_record.phone,
                import_record.website,
                import_record.latitude,
                import_record.longitude,
                owner_user_id,
                CASE
                    WHEN import_record.category = 'dental_clinic' THEN 'dental'
                    WHEN import_record.category = 'hotel' THEN 'hotel'
                    ELSE 'other'
                END,
                import_record.postal_code,
                import_record.prefecture,
                import_record.city,
                import_record.street_address
            );

            -- Mark as processed
            UPDATE shop_imports
            SET processed = true
            WHERE id = import_record.id;

            imported_cnt := imported_cnt + 1;

        EXCEPTION WHEN OTHERS THEN
            -- Log error and continue
            UPDATE shop_imports
            SET processed = true,
                error_message = SQLERRM
            WHERE id = import_record.id;

            error_cnt := error_cnt + 1;
        END;
    END LOOP;

    -- Return summary
    RETURN QUERY SELECT imported_cnt, skipped_cnt, error_cnt;
END;
$$ LANGUAGE plpgsql;

-- 4. BULK INSERT FUNCTION FOR CSV DATA
CREATE OR REPLACE FUNCTION bulk_import_shops(
    shop_data JSONB[]
) RETURNS TABLE(
    processed_count INTEGER,
    success_count INTEGER,
    error_messages TEXT[]
) AS $$
DECLARE
    data_item JSONB;
    processed_cnt INTEGER := 0;
    success_cnt INTEGER := 0;
    errors TEXT[] := ARRAY[]::TEXT[];
    error_msg TEXT;
BEGIN
    FOREACH data_item IN ARRAY shop_data LOOP
        BEGIN
            processed_cnt := processed_cnt + 1;

            INSERT INTO shop_imports (
                name,
                category,
                address,
                postal_code,
                prefecture,
                city,
                street_address,
                phone,
                website,
                latitude,
                longitude,
                source,
                source_id
            ) VALUES (
                data_item->>'name',
                data_item->>'category',
                data_item->>'address',
                data_item->>'postal_code',
                data_item->>'prefecture',
                data_item->>'city',
                data_item->>'street_address',
                data_item->>'phone',
                data_item->>'website',
                (data_item->>'latitude')::NUMERIC,
                (data_item->>'longitude')::NUMERIC,
                COALESCE(data_item->>'source', 'bulk_import'),
                data_item->>'source_id'
            );

            success_cnt := success_cnt + 1;

        EXCEPTION WHEN OTHERS THEN
            error_msg := format('Row %s: %s', processed_cnt, SQLERRM);
            errors := array_append(errors, error_msg);
        END;
    END LOOP;

    RETURN QUERY SELECT processed_cnt, success_cnt, errors;
END;
$$ LANGUAGE plpgsql;

-- 5. VIEW FOR IMPORT STATUS
CREATE OR REPLACE VIEW shop_import_status AS
SELECT
    source,
    category,
    COUNT(*) as total_records,
    COUNT(CASE WHEN processed THEN 1 END) as processed,
    COUNT(CASE WHEN processed AND error_message IS NULL THEN 1 END) as successful,
    COUNT(CASE WHEN processed AND error_message IS NOT NULL THEN 1 END) as failed,
    array_agg(error_message) FILTER (WHERE error_message IS NOT NULL) as error_messages
FROM shop_imports
GROUP BY source, category
ORDER BY source, category;

-- 6. CLEANUP FUNCTION
CREATE OR REPLACE FUNCTION cleanup_failed_imports() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM shop_imports
    WHERE processed = true AND error_message IS NOT NULL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

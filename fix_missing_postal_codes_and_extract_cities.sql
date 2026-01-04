-- ============================================
-- FIX MISSING POSTAL CODES AND EXTRACT CITIES FROM INCOMPLETE ADDRESSES
-- Adds missing postal code mappings and extracts city names from partial addresses
-- ============================================

-- Step 1: Enhanced postal code function with ALL missing mappings
CREATE OR REPLACE FUNCTION extract_city_from_postal_code_complete(postal_code TEXT, shop_prefecture TEXT)
RETURNS TEXT AS $$
DECLARE
  postal_prefix TEXT;
  city_name TEXT;
BEGIN
  IF postal_code IS NULL OR postal_code = '' THEN
    RETURN NULL;
  END IF;

  -- Extract first 3 digits of postal code (handle both XXX-XXXX and XXXXXXX formats)
  postal_prefix := regexp_replace(postal_code, '^([0-9]{3}).*', '\1');
  
  IF postal_prefix IS NULL OR postal_prefix = '' THEN
    RETURN NULL;
  END IF;

  -- Map postal code prefixes to cities - COMPLETE MAPPING
  IF shop_prefecture = 'chiba' THEN
    city_name := CASE postal_prefix
      WHEN '266' THEN '市原'  -- Ichihara (missing!)
      WHEN '267' THEN '市原'  -- Ichihara
      WHEN '268' THEN '大多喜'  -- Otaki
      WHEN '269' THEN '勝浦'  -- Katsura
      WHEN '270' THEN '松戸'  -- Matsudo
      WHEN '271' THEN '松戸'  -- Matsudo
      WHEN '272' THEN '市川'  -- Ichikawa
      WHEN '273' THEN '船橋'  -- Funabashi
      WHEN '274' THEN '船橋'  -- Funabashi
      WHEN '275' THEN '習志野'  -- Narashino
      WHEN '276' THEN '八千代'  -- Yachiyo
      WHEN '277' THEN '柏'    -- Kashiwa
      WHEN '278' THEN '野田'  -- Noda
      WHEN '279' THEN '浦安'  -- Urayasu
      WHEN '280' THEN '千葉'  -- Chiba
      WHEN '281' THEN '千葉'  -- Chiba
      WHEN '282' THEN '千葉'  -- Chiba
      WHEN '283' THEN '大網白里'  -- Oamishirasato
      WHEN '284' THEN '市原'  -- Ichihara
      WHEN '285' THEN '市原'  -- Ichihara
      WHEN '286' THEN '成田'  -- Narita
      WHEN '287' THEN '富里'  -- Tomisato
      WHEN '288' THEN '銚子'  -- Choshi
      WHEN '289' THEN '旭'    -- Asahi
      WHEN '290' THEN '茂原'  -- Mobara
      WHEN '291' THEN '一宮'  -- Ichinomiya
      WHEN '292' THEN '木更津'  -- Kisarazu
      WHEN '293' THEN '富津'  -- Futtsu
      WHEN '294' THEN '館山'  -- Tateyama
      WHEN '295' THEN '南房総'  -- Minamiboso
      WHEN '296' THEN '南房総'  -- Minamiboso
      WHEN '297' THEN '南房総'  -- Minamiboso
      WHEN '298' THEN '南房総'  -- Minamiboso
      WHEN '299' THEN '南房総'  -- Minamiboso
      ELSE NULL
    END;
  ELSIF shop_prefecture = 'ibaraki' THEN
    city_name := CASE postal_prefix
      WHEN '300' THEN '水戸'    -- Mito
      WHEN '301' THEN '水戸'    -- Mito
      WHEN '302' THEN '水戸'    -- Mito
      WHEN '303' THEN '常陸太田'  -- Hitachiota
      WHEN '304' THEN '日立'    -- Hitachi
      WHEN '305' THEN 'つくば'  -- Tsukuba
      WHEN '306' THEN 'つくば'  -- Tsukuba
      WHEN '307' THEN 'つくば'  -- Tsukuba
      WHEN '308' THEN '土浦'    -- Tsuchiura
      WHEN '309' THEN '石岡'    -- Ishioka
      WHEN '310' THEN '水戸'    -- Mito (missing!)
      WHEN '311' THEN '水戸'    -- Mito
      WHEN '312' THEN '水戸'    -- Mito
      WHEN '313' THEN '水戸'    -- Mito
      WHEN '314' THEN '鹿嶋'    -- Kashima
      WHEN '315' THEN '石岡'    -- Ishioka
      WHEN '316' THEN '日立'    -- Hitachi
      WHEN '317' THEN '日立'    -- Hitachi
      WHEN '318' THEN '高萩'    -- Takahagi
      WHEN '319' THEN '北茨城'  -- Kitaibaraki
      WHEN '320' THEN '宇都宮'  -- Utsunomiya (missing! - but this is Tochigi, not Ibaraki)
      WHEN '321' THEN '真岡'    -- Moka (missing!)
      WHEN '322' THEN '下妻'    -- Shimotsuma
      WHEN '323' THEN '下館'    -- Shimodate
      WHEN '324' THEN '大子'    -- Daigo
      WHEN '325' THEN '那珂'    -- Naka
      WHEN '326' THEN '結城'    -- Yuki
      WHEN '327' THEN '古河'    -- Koga
      WHEN '328' THEN '下野'    -- Shimotsuke (missing!)
      WHEN '329' THEN '桜川'    -- Sakuragawa (missing!)
      WHEN '330' THEN '取手'    -- Toride
      WHEN '331' THEN '守谷'    -- Moriya
      WHEN '332' THEN '取手'    -- Toride
      ELSE NULL
    END;
  ELSIF shop_prefecture = 'gunma' THEN
    city_name := CASE postal_prefix
      WHEN '370' THEN '高崎'    -- Takasaki
      WHEN '371' THEN '前橋'    -- Maebashi
      WHEN '372' THEN '伊勢崎'  -- Isesaki
      WHEN '373' THEN '太田'    -- Ota
      WHEN '374' THEN '太田'    -- Ota
      WHEN '375' THEN '館林'    -- Tatebayashi
      WHEN '376' THEN '桐生'    -- Kiryu
      WHEN '377' THEN '草津'    -- Kusatsu
      WHEN '378' THEN '沼田'    -- Numata
      WHEN '379' THEN '前橋'    -- Maebashi (missing!)
      WHEN '380' THEN '長野'    -- Nagano (wrong prefecture, but included for completeness)
      ELSE NULL
    END;
  ELSIF shop_prefecture = 'hyogo' THEN
    city_name := CASE postal_prefix
      WHEN '640' THEN '和歌山'  -- Wakayama (missing! - but this is Wakayama prefecture, not Hyogo)
      WHEN '650' THEN '神戸'    -- Kobe
      WHEN '651' THEN '神戸'    -- Kobe
      WHEN '652' THEN '神戸'    -- Kobe
      WHEN '653' THEN '神戸'    -- Kobe
      WHEN '654' THEN '神戸'    -- Kobe
      WHEN '655' THEN '神戸'    -- Kobe
      WHEN '656' THEN '神戸'    -- Kobe
      WHEN '657' THEN '神戸'    -- Kobe
      WHEN '658' THEN '神戸'    -- Kobe
      WHEN '659' THEN '神戸'    -- Kobe
      WHEN '660' THEN '尼崎'    -- Amagasaki
      WHEN '661' THEN '尼崎'    -- Amagasaki
      WHEN '662' THEN '西宮'    -- Nishinomiya
      WHEN '663' THEN '西宮'    -- Nishinomiya
      WHEN '664' THEN '伊丹'    -- Itami
      WHEN '665' THEN '宝塚'    -- Takarazuka
      WHEN '666' THEN '川西'    -- Kawanishi
      WHEN '667' THEN '三田'    -- Sanda
      WHEN '668' THEN '丹波篠山'  -- Tamba-Sasayama
      WHEN '669' THEN '丹波'    -- Tamba
      WHEN '670' THEN '姫路'    -- Himeji
      WHEN '671' THEN '姫路'    -- Himeji
      WHEN '672' THEN '姫路'    -- Himeji
      WHEN '673' THEN '三木'    -- Miki
      WHEN '674' THEN '加古川'  -- Kakogawa
      WHEN '675' THEN '加古川'  -- Kakogawa
      WHEN '676' THEN '高砂'    -- Takasago
      WHEN '677' THEN '加西'    -- Kasai
      WHEN '678' THEN 'たつの'  -- Tatsuno
      WHEN '679' THEN '宍粟'    -- Shiso
      WHEN '680' THEN '朝来'    -- Asago
      WHEN '681' THEN '養父'    -- Yabu
      WHEN '682' THEN '豊岡'    -- Toyoka
      WHEN '683' THEN '香美'    -- Kami
      WHEN '684' THEN '新温泉'  -- Shinonsen
      WHEN '685' THEN '美方'    -- Mikata
      WHEN '707' THEN '佐用'    -- Sayo
      ELSE NULL
    END;
  ELSIF shop_prefecture = 'fukuoka' THEN
    city_name := CASE postal_prefix
      WHEN '800' THEN '北九州'  -- Kitakyushu
      WHEN '801' THEN '北九州'  -- Kitakyushu
      WHEN '802' THEN '北九州'  -- Kitakyushu
      WHEN '803' THEN '北九州'  -- Kitakyushu
      WHEN '804' THEN '北九州'  -- Kitakyushu
      WHEN '805' THEN '北九州'  -- Kitakyushu
      WHEN '806' THEN '北九州'  -- Kitakyushu
      WHEN '807' THEN '北九州'  -- Kitakyushu
      WHEN '808' THEN '北九州'  -- Kitakyushu
      WHEN '810' THEN '福岡'    -- Fukuoka
      WHEN '811' THEN '福岡'    -- Fukuoka
      WHEN '812' THEN '福岡'    -- Fukuoka
      WHEN '813' THEN '福岡'    -- Fukuoka
      WHEN '814' THEN '福岡'    -- Fukuoka
      WHEN '815' THEN '福岡'    -- Fukuoka
      WHEN '816' THEN '福岡'    -- Fukuoka
      WHEN '817' THEN '福岡'    -- Fukuoka
      WHEN '818' THEN '福岡'    -- Fukuoka
      WHEN '819' THEN '福岡'    -- Fukuoka
      WHEN '820' THEN '飯塚'    -- Iizuka
      WHEN '821' THEN '直方'    -- Nogata
      WHEN '822' THEN '田川'    -- Tagawa
      WHEN '823' THEN '久留米'  -- Kurume
      WHEN '824' THEN '行橋'    -- Yukuhashi
      WHEN '830' THEN '久留米'  -- Kurume
      WHEN '831' THEN '久留米'  -- Kurume
      WHEN '832' THEN '久留米'  -- Kurume
      WHEN '833' THEN '久留米'  -- Kurume
      WHEN '834' THEN '久留米'  -- Kurume
      WHEN '835' THEN '久留米'  -- Kurume
      WHEN '836' THEN '久留米'  -- Kurume
      WHEN '837' THEN '久留米'  -- Kurume
      WHEN '838' THEN '久留米'  -- Kurume
      WHEN '839' THEN '久留米'  -- Kurume
      WHEN '840' THEN '佐賀'    -- Saga (wrong prefecture, but included)
      ELSE NULL
    END;
  ELSIF shop_prefecture = 'hokkaido' THEN
    city_name := CASE postal_prefix
      WHEN '001' THEN '札幌'    -- Sapporo
      WHEN '002' THEN '札幌'    -- Sapporo
      WHEN '003' THEN '札幌'    -- Sapporo
      WHEN '004' THEN '札幌'    -- Sapporo
      WHEN '005' THEN '札幌'    -- Sapporo
      WHEN '006' THEN '札幌'    -- Sapporo
      WHEN '007' THEN '札幌'    -- Sapporo
      WHEN '008' THEN '札幌'    -- Sapporo
      WHEN '010' THEN '旭川'    -- Asahikawa
      WHEN '011' THEN '旭川'    -- Asahikawa
      WHEN '012' THEN '旭川'    -- Asahikawa
      WHEN '013' THEN '網走'    -- Abashiri
      WHEN '014' THEN '網走'    -- Abashiri
      WHEN '015' THEN '網走'    -- Abashiri
      WHEN '016' THEN '網走'    -- Abashiri
      WHEN '017' THEN '網走'    -- Abashiri
      WHEN '018' THEN '網走'    -- Abashiri
      WHEN '020' THEN '帯広'    -- Obihiro
      WHEN '021' THEN '帯広'    -- Obihiro
      WHEN '022' THEN '帯広'    -- Obihiro
      WHEN '023' THEN '帯広'    -- Obihiro
      WHEN '024' THEN '帯広'    -- Obihiro
      WHEN '025' THEN '帯広'    -- Obihiro
      WHEN '026' THEN '帯広'    -- Obihiro
      WHEN '027' THEN '帯広'    -- Obihiro
      WHEN '028' THEN '帯広'    -- Obihiro
      WHEN '029' THEN '帯広'    -- Obihiro
      WHEN '030' THEN '釧路'    -- Kushiro
      WHEN '031' THEN '釧路'    -- Kushiro
      WHEN '032' THEN '釧路'    -- Kushiro
      WHEN '033' THEN '釧路'    -- Kushiro
      WHEN '034' THEN '釧路'    -- Kushiro
      WHEN '035' THEN '釧路'    -- Kushiro
      WHEN '036' THEN '釧路'    -- Kushiro
      WHEN '037' THEN '釧路'    -- Kushiro
      WHEN '038' THEN '釧路'    -- Kushiro
      WHEN '039' THEN '釧路'    -- Kushiro
      WHEN '040' THEN '函館'    -- Hakodate
      WHEN '041' THEN '函館'    -- Hakodate
      WHEN '042' THEN '函館'    -- Hakodate
      WHEN '043' THEN '函館'    -- Hakodate
      WHEN '044' THEN '函館'    -- Hakodate
      WHEN '045' THEN '函館'    -- Hakodate
      WHEN '046' THEN '函館'    -- Hakodate
      WHEN '047' THEN '函館'    -- Hakodate
      WHEN '048' THEN '函館'    -- Hakodate
      WHEN '049' THEN '函館'    -- Hakodate
      WHEN '050' THEN '室蘭'    -- Muroran
      WHEN '051' THEN '室蘭'    -- Muroran
      WHEN '052' THEN '室蘭'    -- Muroran
      WHEN '053' THEN '室蘭'    -- Muroran
      WHEN '054' THEN '室蘭'    -- Muroran
      WHEN '055' THEN '室蘭'    -- Muroran
      WHEN '056' THEN '室蘭'    -- Muroran
      WHEN '057' THEN '室蘭'    -- Muroran
      WHEN '058' THEN '室蘭'    -- Muroran
      WHEN '059' THEN '室蘭'    -- Muroran
      WHEN '060' THEN '札幌'    -- Sapporo
      WHEN '061' THEN '札幌'    -- Sapporo
      WHEN '062' THEN '札幌'    -- Sapporo
      WHEN '063' THEN '札幌'    -- Sapporo
      WHEN '064' THEN '札幌'    -- Sapporo
      WHEN '065' THEN '札幌'    -- Sapporo
      WHEN '066' THEN '札幌'    -- Sapporo
      WHEN '067' THEN '札幌'    -- Sapporo
      WHEN '068' THEN '札幌'    -- Sapporo
      WHEN '069' THEN '札幌'    -- Sapporo
      WHEN '070' THEN '旭川'    -- Asahikawa
      WHEN '071' THEN '旭川'    -- Asahikawa
      WHEN '072' THEN '旭川'    -- Asahikawa
      WHEN '073' THEN '旭川'    -- Asahikawa
      WHEN '074' THEN '旭川'    -- Asahikawa
      WHEN '075' THEN '旭川'    -- Asahikawa
      WHEN '076' THEN '旭川'    -- Asahikawa
      WHEN '077' THEN '旭川'    -- Asahikawa
      WHEN '078' THEN '旭川'    -- Asahikawa
      WHEN '079' THEN '旭川'    -- Asahikawa
      WHEN '080' THEN '帯広'    -- Obihiro
      WHEN '081' THEN '帯広'    -- Obihiro
      WHEN '082' THEN '帯広'    -- Obihiro
      WHEN '083' THEN '帯広'    -- Obihiro
      WHEN '084' THEN '帯広'    -- Obihiro
      WHEN '085' THEN '帯広'    -- Obihiro
      WHEN '086' THEN '帯広'    -- Obihiro
      WHEN '087' THEN '帯広'    -- Obihiro
      WHEN '088' THEN '帯広'    -- Obihiro
      WHEN '089' THEN '帯広'    -- Obihiro
      WHEN '090' THEN '釧路'    -- Kushiro
      WHEN '091' THEN '釧路'    -- Kushiro
      WHEN '092' THEN '釧路'    -- Kushiro
      WHEN '093' THEN '釧路'    -- Kushiro
      WHEN '094' THEN '釧路'    -- Kushiro
      WHEN '095' THEN '釧路'    -- Kushiro
      WHEN '096' THEN '釧路'    -- Kushiro
      WHEN '097' THEN '釧路'    -- Kushiro
      WHEN '098' THEN '釧路'    -- Kushiro
      WHEN '099' THEN '釧路'    -- Kushiro
      ELSE NULL
    END;
  END IF;

  RETURN city_name;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Enhanced extraction function that extracts city names from partial addresses
CREATE OR REPLACE FUNCTION extract_city_from_incomplete_address(address_text TEXT, shop_prefecture TEXT)
RETURNS TEXT AS $$
DECLARE
  city_name TEXT;
  postal_code TEXT;
  address_lower TEXT;
  matched_city RECORD;
BEGIN
  IF address_text IS NULL OR address_text = '' THEN
    RETURN NULL;
  END IF;

  address_lower := LOWER(address_text);

  -- First, try to extract postal code and get city from it
  postal_code := regexp_replace(address_text, '.*([0-9]{3}-?[0-9]{4}).*', '\1');
  IF postal_code IS NOT NULL AND postal_code != '' THEN
    city_name := extract_city_from_postal_code_complete(postal_code, shop_prefecture);
    IF city_name IS NOT NULL AND city_name != '' THEN
      RETURN city_name;
    END IF;
  END IF;

  -- Extract city names from partial addresses (e.g., "向273‐5 和歌山 640‐8431" -> "和歌山")
  -- Common city names that appear in addresses
  IF address_text LIKE '%和歌山%' OR address_text LIKE '%Wakayama%' OR address_lower LIKE '%wakayama%' THEN
    RETURN '和歌山';
  END IF;
  
  IF address_text LIKE '%宇都宮%' OR address_text LIKE '%Utsunomiya%' OR address_lower LIKE '%utsunomiya%' THEN
    RETURN '宇都宮';
  END IF;
  
  IF address_text LIKE '%水戸%' OR address_text LIKE '%Mito%' OR address_lower LIKE '%mito%' THEN
    RETURN '水戸';
  END IF;
  
  IF address_text LIKE '%神戸%' OR address_text LIKE '%Kobe%' OR address_lower LIKE '%kobe%' THEN
    RETURN '神戸';
  END IF;
  
  IF address_text LIKE '%姫路%' OR address_text LIKE '%Himeji%' OR address_lower LIKE '%himeji%' THEN
    RETURN '姫路';
  END IF;
  
  IF address_text LIKE '%加古川%' OR address_text LIKE '%Kakogawa%' OR address_lower LIKE '%kakogawa%' THEN
    RETURN '加古川';
  END IF;
  
  IF address_text LIKE '%三木%' OR address_text LIKE '%Miki%' OR address_lower LIKE '%miki%' THEN
    RETURN '三木';
  END IF;
  
  IF address_text LIKE '%前橋%' OR address_text LIKE '%Maebashi%' OR address_lower LIKE '%maebashi%' THEN
    RETURN '前橋';
  END IF;
  
  IF address_text LIKE '%高崎%' OR address_text LIKE '%Takasaki%' OR address_lower LIKE '%takasaki%' THEN
    RETURN '高崎';
  END IF;
  
  IF address_text LIKE '%行徳%' OR address_text LIKE '%Gyotoku%' OR address_lower LIKE '%gyotoku%' THEN
    RETURN '行徳';
  END IF;
  
  IF address_text LIKE '%元町%' OR address_text LIKE '%Motomachi%' OR address_lower LIKE '%motomachi%' THEN
    -- For Hyogo, this is likely Kobe's Motomachi
    IF shop_prefecture = 'hyogo' THEN
      RETURN '神戸';
    END IF;
  END IF;
  
  IF address_text LIKE '%花隈%' OR address_text LIKE '%Hanakuma%' OR address_lower LIKE '%hanakuma%' THEN
    -- For Hyogo, this is likely Kobe's Hanakuma
    IF shop_prefecture = 'hyogo' THEN
      RETURN '神戸';
    END IF;
  END IF;

  -- Try cities table lookup (from previous function)
  IF shop_prefecture IS NOT NULL AND shop_prefecture != '' THEN
    DECLARE
      pref_name TEXT;
    BEGIN
      pref_name := CASE shop_prefecture
        WHEN 'hokkaido' THEN 'Hokkaido'
        WHEN 'tokyo' THEN 'Tokyo'
        WHEN 'osaka' THEN 'Osaka'
        WHEN 'kyoto' THEN 'Kyoto'
        WHEN 'chiba' THEN 'Chiba'
        WHEN 'kanagawa' THEN 'Kanagawa'
        WHEN 'saitama' THEN 'Saitama'
        WHEN 'hyogo' THEN 'Hyogo'
        WHEN 'fukuoka' THEN 'Fukuoka'
        WHEN 'gunma' THEN 'Gunma'
        WHEN 'ibaraki' THEN 'Ibaraki'
        WHEN 'tochigi' THEN 'Tochigi'
        WHEN 'shiga' THEN 'Shiga'
        ELSE NULL
      END;
      
      FOR matched_city IN 
        SELECT name, slug 
        FROM cities 
        WHERE prefecture_name = pref_name
          AND (address_text LIKE '%' || name || '%' OR address_lower LIKE '%' || LOWER(slug) || '%')
        ORDER BY LENGTH(name) DESC
        LIMIT 1
      LOOP
        RETURN matched_city.name;
      END LOOP;
    END;
  END IF;

  -- Pattern: Extract city names from road names (e.g., "国道50号水戸バイパス" -> "水戸")
  SELECT regexp_replace(
    (regexp_match(address_text, '([^都道府県\s,]+)(街道|通り|線|バイパス)'))[1],
    '[街道通り線バイパス]', ''
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' 
     AND LENGTH(TRIM(city_name)) > 1 
     AND city_name NOT SIMILAR TO '%[0-9]%' THEN
    RETURN TRIM(city_name);
  END IF;

  -- Pattern: Japanese city suffixes
  SELECT regexp_replace(
    (regexp_match(address_text, '([^都道府県\s,]+[区市町村郡])'))[1],
    '[区市町村郡]', ''
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' AND LENGTH(TRIM(city_name)) > 0 THEN
    RETURN TRIM(city_name);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update all shops with missing normalized_city using the enhanced function
UPDATE shops
SET normalized_city = extract_city_from_incomplete_address(address, prefecture)
WHERE (normalized_city IS NULL OR normalized_city = '')
  AND address IS NOT NULL
  AND address != '';

-- Step 4: Verification
SELECT 
  'After Enhanced Update' AS status,
  COUNT(*) AS total_shops,
  COUNT(normalized_city) AS shops_with_normalized_city,
  COUNT(*) - COUNT(normalized_city) AS shops_still_missing_city,
  ROUND(COUNT(normalized_city)::numeric / COUNT(*)::numeric * 100, 2) AS percentage_populated
FROM shops
WHERE address IS NOT NULL
  AND address != '';

-- Step 5: Show sample of newly extracted cities
SELECT 
  name,
  address,
  prefecture,
  normalized_city,
  CASE 
    WHEN address ~ '^[0-9-]+$' THEN 'Postal code only'
    WHEN address ~ '^[0-9]+$' THEN 'Number only'
    WHEN address ~ '国道|線|通り|バイパス' THEN 'Road name only'
    ELSE 'Other incomplete format'
  END AS address_type
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND prefecture IN ('chiba', 'ibaraki', 'gunma', 'hyogo', 'fukuoka', 'hokkaido')
  AND (address ~ '^[0-9-]+$' OR address ~ '^[0-9]+$' OR address LIKE '%和歌山%' OR address LIKE '%宇都宮%' OR address LIKE '%神戸%' OR address LIKE '%行徳%' OR address LIKE '%元町%' OR address LIKE '%花隈%')
ORDER BY prefecture, normalized_city
LIMIT 50;

-- Step 6: Remaining shops that still need manual review (addresses that are just numbers)
SELECT 
  id,
  name,
  address,
  prefecture,
  normalized_city,
  'Number only - cannot extract city' AS reason
FROM shops
WHERE (normalized_city IS NULL OR normalized_city = '')
  AND address IS NOT NULL
  AND address != ''
  AND address ~ '^[0-9-]+$'  -- Just numbers
  AND prefecture IS NOT NULL
ORDER BY prefecture
LIMIT 100;


-- ============================================
-- EXTRACT CITY FROM POSTAL CODES AND INCOMPLETE ADDRESSES
-- Uses postal code ranges and better pattern matching
-- ============================================

-- Step 1: Create function to extract city from postal code (Chiba prefecture example)
-- Japanese postal codes: Format is XXX-XXXX (3 digits - 4 digits)
-- First 3 digits indicate the area/city
CREATE OR REPLACE FUNCTION extract_city_from_postal_code(postal_code TEXT, shop_prefecture TEXT)
RETURNS TEXT AS $$
DECLARE
  postal_prefix TEXT;
  city_name TEXT;
BEGIN
  IF postal_code IS NULL OR postal_code = '' THEN
    RETURN NULL;
  END IF;

  -- Extract first 3 digits of postal code
  postal_prefix := regexp_replace(postal_code, '^([0-9]{3}).*', '\1');
  
  IF postal_prefix IS NULL OR postal_prefix = '' THEN
    RETURN NULL;
  END IF;

  -- Map postal code prefixes to cities (Chiba prefecture examples)
  -- This is a simplified mapping - you may need to expand this
  IF shop_prefecture = 'chiba' THEN
    city_name := CASE postal_prefix
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
      WHEN '292' THEN '木更津'  -- Kisarazu
      WHEN '293' THEN '富津'  -- Futtsu
      WHEN '294' THEN '館山'  -- Tateyama
      WHEN '299' THEN '南房総'  -- Minamiboso
      ELSE NULL
    END;
  ELSIF shop_prefecture = 'tokyo' THEN
    city_name := CASE postal_prefix
      WHEN '100' THEN '千代田'  -- Chiyoda
      WHEN '101' THEN '千代田'  -- Chiyoda
      WHEN '102' THEN '千代田'  -- Chiyoda
      WHEN '103' THEN '中央'    -- Chuo
      WHEN '104' THEN '中央'    -- Chuo
      WHEN '105' THEN '港'      -- Minato
      WHEN '106' THEN '港'      -- Minato
      WHEN '107' THEN '港'      -- Minato
      WHEN '108' THEN '港'      -- Minato
      WHEN '110' THEN '台東'    -- Taito
      WHEN '111' THEN '台東'    -- Taito
      WHEN '112' THEN '文京'    -- Bunkyo
      WHEN '113' THEN '文京'    -- Bunkyo
      WHEN '120' THEN '足立'    -- Adachi
      WHEN '121' THEN '足立'    -- Adachi
      WHEN '130' THEN '墨田'    -- Sumida
      WHEN '131' THEN '墨田'    -- Sumida
      WHEN '132' THEN '江戸川'  -- Edogawa
      WHEN '133' THEN '江戸川'  -- Edogawa
      WHEN '134' THEN '江戸川'  -- Edogawa
      WHEN '135' THEN '江東'    -- Koto
      WHEN '136' THEN '江東'    -- Koto
      WHEN '140' THEN '品川'    -- Shinagawa
      WHEN '141' THEN '品川'    -- Shinagawa
      WHEN '142' THEN '品川'    -- Shinagawa
      WHEN '143' THEN '大田'    -- Ota
      WHEN '144' THEN '大田'    -- Ota
      WHEN '150' THEN '渋谷'    -- Shibuya
      WHEN '151' THEN '渋谷'    -- Shibuya
      WHEN '152' THEN '目黒'    -- Meguro
      WHEN '153' THEN '目黒'    -- Meguro
      WHEN '154' THEN '世田谷'  -- Setagaya
      WHEN '155' THEN '世田谷'  -- Setagaya
      WHEN '156' THEN '世田谷'  -- Setagaya
      WHEN '157' THEN '世田谷'  -- Setagaya
      WHEN '158' THEN '世田谷'  -- Setagaya
      WHEN '160' THEN '新宿'    -- Shinjuku
      WHEN '161' THEN '新宿'    -- Shinjuku
      WHEN '162' THEN '新宿'    -- Shinjuku
      WHEN '163' THEN '新宿'    -- Shinjuku
      WHEN '164' THEN '中野'    -- Nakano
      WHEN '165' THEN '中野'    -- Nakano
      WHEN '166' THEN '杉並'    -- Suginami
      WHEN '167' THEN '杉並'    -- Suginami
      WHEN '168' THEN '杉並'    -- Suginami
      WHEN '169' THEN '新宿'    -- Shinjuku
      WHEN '170' THEN '豊島'    -- Toshima
      WHEN '171' THEN '豊島'    -- Toshima
      WHEN '172' THEN '板橋'    -- Itabashi
      WHEN '173' THEN '板橋'    -- Itabashi
      WHEN '174' THEN '板橋'    -- Itabashi
      WHEN '175' THEN '練馬'    -- Nerima
      WHEN '176' THEN '練馬'    -- Nerima
      WHEN '177' THEN '練馬'    -- Nerima
      WHEN '178' THEN '練馬'    -- Nerima
      WHEN '179' THEN '練馬'    -- Nerima
      WHEN '180' THEN '武蔵野'  -- Musashino
      WHEN '181' THEN '三鷹'    -- Mitaka
      WHEN '182' THEN '調布'    -- Chofu
      WHEN '183' THEN '府中'    -- Fuchu
      WHEN '184' THEN '小金井'  -- Koganei
      WHEN '185' THEN '国分寺'  -- Kokubunji
      WHEN '186' THEN '国立'    -- Kunitachi
      WHEN '187' THEN '東村山'  -- Higashimurayama
      WHEN '188' THEN '東村山'  -- Higashimurayama
      WHEN '189' THEN '清瀬'    -- Kiyose
      WHEN '190' THEN '立川'    -- Tachikawa
      WHEN '191' THEN '日野'    -- Hino
      WHEN '192' THEN '八王子'  -- Hachioji
      WHEN '193' THEN '八王子'  -- Hachioji
      WHEN '194' THEN '町田'    -- Machida
      WHEN '196' THEN '昭島'    -- Akishima
      WHEN '197' THEN 'あきる野'  -- Akiruno
      WHEN '198' THEN '青梅'    -- Ome
      WHEN '199' THEN '奥多摩'  -- Okutama
      ELSE NULL
    END;
  ELSIF shop_prefecture = 'osaka' THEN
    city_name := CASE postal_prefix
      WHEN '530' THEN '大阪'    -- Osaka
      WHEN '531' THEN '大阪'    -- Osaka
      WHEN '532' THEN '大阪'    -- Osaka
      WHEN '533' THEN '大阪'    -- Osaka
      WHEN '534' THEN '大阪'    -- Osaka
      WHEN '535' THEN '大阪'    -- Osaka
      WHEN '536' THEN '大阪'    -- Osaka
      WHEN '537' THEN '大阪'    -- Osaka
      WHEN '538' THEN '大阪'    -- Osaka
      WHEN '539' THEN '大阪'    -- Osaka
      WHEN '540' THEN '大阪'    -- Osaka
      WHEN '541' THEN '大阪'    -- Osaka
      WHEN '542' THEN '大阪'    -- Osaka
      WHEN '543' THEN '大阪'    -- Osaka
      WHEN '544' THEN '大阪'    -- Osaka
      WHEN '545' THEN '大阪'    -- Osaka
      WHEN '546' THEN '大阪'    -- Osaka
      WHEN '547' THEN '大阪'    -- Osaka
      WHEN '550' THEN '大阪'    -- Osaka
      WHEN '551' THEN '大阪'    -- Osaka
      WHEN '552' THEN '大阪'    -- Osaka
      WHEN '553' THEN '大阪'    -- Osaka
      WHEN '554' THEN '大阪'    -- Osaka
      WHEN '555' THEN '大阪'    -- Osaka
      WHEN '556' THEN '大阪'    -- Osaka
      WHEN '557' THEN '大阪'    -- Osaka
      WHEN '558' THEN '大阪'    -- Osaka
      WHEN '559' THEN '大阪'    -- Osaka
      WHEN '560' THEN '豊中'    -- Toyonaka
      WHEN '561' THEN '豊中'    -- Toyonaka
      WHEN '562' THEN '箕面'    -- Mino
      WHEN '563' THEN '池田'    -- Ikeda
      WHEN '564' THEN '吹田'    -- Suita
      WHEN '565' THEN '吹田'    -- Suita
      WHEN '566' THEN '摂津'    -- Settsu
      WHEN '567' THEN '茨木'    -- Ibaraki
      WHEN '568' THEN '高槻'  -- Takatsuki
      WHEN '569' THEN '高槻'  -- Takatsuki
      WHEN '570' THEN '枚方'    -- Hirakata
      WHEN '571' THEN '枚方'    -- Hirakata
      WHEN '572' THEN '寝屋川'  -- Neyagawa
      WHEN '573' THEN '守口'    -- Moriguchi
      WHEN '574' THEN '大東'    -- Daito
      WHEN '575' THEN '東大阪'  -- Higashiosaka
      WHEN '576' THEN '東大阪'  -- Higashiosaka
      WHEN '577' THEN '八尾'    -- Yao
      WHEN '578' THEN '柏原'    -- Kashiwara
      WHEN '579' THEN '松原'    -- Matsubara
      WHEN '580' THEN '堺'      -- Sakai
      WHEN '590' THEN '和泉'    -- Izumi
      WHEN '591' THEN '和泉'    -- Izumi
      WHEN '592' THEN '岸和田'  -- Kishiwada
      WHEN '593' THEN '貝塚'    -- Kaizuka
      WHEN '594' THEN '泉佐野'  -- Izumisano
      WHEN '595' THEN '泉南'    -- Sennan
      WHEN '596' THEN '阪南'    -- Hannan
      WHEN '597' THEN '河内長野'  -- Kawachinagano
      WHEN '598' THEN '富田林'  -- Tondabayashi
      WHEN '599' THEN '羽曳野'  -- Habikino
      ELSE NULL
    END;
  ELSIF shop_prefecture = 'hyogo' THEN
    city_name := CASE postal_prefix
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
  ELSIF shop_prefecture = 'kyoto' THEN
    city_name := CASE postal_prefix
      WHEN '600' THEN '京都市'  -- Kyoto City
      WHEN '601' THEN '京都市'  -- Kyoto City
      WHEN '602' THEN '京都市'  -- Kyoto City
      WHEN '603' THEN '京都市'  -- Kyoto City
      WHEN '604' THEN '京都市'  -- Kyoto City
      WHEN '605' THEN '京都市'  -- Kyoto City
      WHEN '606' THEN '京都市'  -- Kyoto City
      WHEN '607' THEN '京都市'  -- Kyoto City
      WHEN '608' THEN '京都市'  -- Kyoto City
      WHEN '609' THEN '京都市'  -- Kyoto City
      WHEN '610' THEN '京都市'  -- Kyoto City
      WHEN '611' THEN '京都市'  -- Kyoto City
      WHEN '612' THEN '京都市'  -- Kyoto City
      WHEN '613' THEN '京都市'  -- Kyoto City
      WHEN '614' THEN '京都市'  -- Kyoto City
      WHEN '615' THEN '京都市'  -- Kyoto City
      WHEN '616' THEN '京都市'  -- Kyoto City
      WHEN '617' THEN '長岡京'  -- Nagaokakyo
      WHEN '618' THEN '大山崎'  -- Oyamazaki
      WHEN '619' THEN '宇治'    -- Uji
      WHEN '620' THEN '城陽'    -- Joyo
      WHEN '621' THEN '木津川'  -- Kizugawa
      WHEN '622' THEN '精華'    -- Seika
      WHEN '623' THEN '京田辺'  -- Kyotanabe
      WHEN '624' THEN '八幡'    -- Yawata
      WHEN '625' THEN '久御山'  -- Kumiyama
      WHEN '626' THEN '綾部'    -- Ayabe
      WHEN '627' THEN '福知山'  -- Fukuchiyama
      WHEN '629' THEN '南丹'    -- Nantan
      WHEN '630' THEN '亀岡'    -- Kameoka
      WHEN '601' THEN '京都市'  -- Kyoto City
      ELSE NULL
    END;
  END IF;

  RETURN city_name;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Enhanced extraction function that uses postal codes and better pattern matching
CREATE OR REPLACE FUNCTION extract_city_ultimate(address_text TEXT, shop_prefecture TEXT)
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
    city_name := extract_city_from_postal_code(postal_code, shop_prefecture);
    IF city_name IS NOT NULL AND city_name != '' THEN
      RETURN city_name;
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

  -- Pattern 1: Extract city names from road names
  -- Examples: "茂原街道" -> "茂原", "成田街道" -> "成田"
  SELECT regexp_replace(
    (regexp_match(address_text, '([^都道府県\s,]+)(街道|通り|線|バイパス)'))[1],
    '[街道通り線バイパス]', ''
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' 
     AND LENGTH(TRIM(city_name)) > 1 
     AND city_name NOT SIMILAR TO '%[0-9]%' THEN
    RETURN TRIM(city_name);
  END IF;

  -- Pattern 2: Japanese city suffixes
  SELECT regexp_replace(
    (regexp_match(address_text, '([^都道府県\s,]+[区市町村郡])'))[1],
    '[区市町村郡]', ''
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' AND LENGTH(TRIM(city_name)) > 0 THEN
    RETURN TRIM(city_name);
  END IF;

  -- Pattern 3: Common city names in addresses (hardcoded patterns)
  IF address_text LIKE '%松戸%' OR address_text LIKE '%Matsudo%' THEN
    RETURN '松戸';
  END IF;
  
  IF address_text LIKE '%津田沼%' OR address_text LIKE '%Tsudanuma%' THEN
    RETURN '津田沼';
  END IF;
  
  IF address_text LIKE '%千葉%' OR address_text LIKE '%Chiba%' THEN
    RETURN '千葉';
  END IF;
  
  IF address_text LIKE '%江戸川%' OR address_text LIKE '%Edogawa%' THEN
    RETURN '江戸川';
  END IF;
  
  IF address_text LIKE '%新宿%' OR address_text LIKE '%Shinjuku%' THEN
    RETURN '新宿';
  END IF;
  
  IF address_text LIKE '%渋谷%' OR address_text LIKE '%Shibuya%' THEN
    RETURN '渋谷';
  END IF;
  
  IF address_text LIKE '%難波%' OR address_text LIKE '%Namba%' THEN
    RETURN '難波';
  END IF;
  
  IF address_text LIKE '%日本橋%' OR address_text LIKE '%Nihonbashi%' THEN
    RETURN '日本橋';
  END IF;
  
  IF address_text LIKE '%築地%' OR address_text LIKE '%Tsukiji%' THEN
    RETURN '築地';
  END IF;
  
  IF address_text LIKE '%神田%' OR address_text LIKE '%Kanda%' THEN
    RETURN '神田';
  END IF;
  
  IF address_text LIKE '%茂原%' OR address_text LIKE '%Mobara%' THEN
    RETURN '茂原';
  END IF;
  
  IF address_text LIKE '%成田%' OR address_text LIKE '%Narita%' THEN
    RETURN '成田';
  END IF;
  
  IF address_text LIKE '%神戸%' OR address_text LIKE '%Kobe%' THEN
    RETURN '神戸';
  END IF;
  
  IF address_text LIKE '%三木%' OR address_text LIKE '%Miki%' THEN
    RETURN '三木';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update all shops with missing normalized_city using ultimate function
UPDATE shops
SET normalized_city = extract_city_ultimate(address, prefecture)
WHERE (normalized_city IS NULL OR normalized_city = '')
  AND address IS NOT NULL
  AND address != '';

-- Step 4: Verification
SELECT 
  'After Ultimate Update' AS status,
  COUNT(*) AS total_shops,
  COUNT(normalized_city) AS shops_with_normalized_city,
  COUNT(*) - COUNT(normalized_city) AS shops_still_missing_city,
  ROUND(COUNT(normalized_city)::numeric / COUNT(*)::numeric * 100, 2) AS percentage_populated
FROM shops
WHERE address IS NOT NULL
  AND address != '';

-- Step 5: Show distribution
SELECT 
  normalized_city,
  prefecture,
  COUNT(*) AS shop_count
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND prefecture IS NOT NULL
GROUP BY normalized_city, prefecture
ORDER BY shop_count DESC
LIMIT 50;

-- Step 6: Sample of extracted cities (including from postal codes)
SELECT 
  name,
  address,
  prefecture,
  normalized_city
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND prefecture IN ('chiba', 'tokyo', 'osaka', 'kyoto', 'hyogo')
ORDER BY prefecture, normalized_city
LIMIT 50;

-- Step 7: Remaining shops that still need manual review
SELECT 
  id,
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
WHERE (normalized_city IS NULL OR normalized_city = '')
  AND address IS NOT NULL
  AND address != ''
  AND prefecture IS NOT NULL
ORDER BY prefecture
LIMIT 100;


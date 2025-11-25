// apps/api/src/scripts/importJapanShopsOSM.ts
// Japan-wide shop importer using OpenStreetMap/Nominatim (FREE, NO API KEY)
// Covers Tokyo, Osaka, and Kyoto with all major stations and districts

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import * as fs from "fs";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Checkpoint file to resume from where we left off
const CHECKPOINT_FILE = path.resolve(__dirname, "../../import_checkpoint.json");

// Local dataset file to save/load shops
const DATA_DIR = path.resolve(__dirname, "../../data");
const DATASET_FILE = path.resolve(DATA_DIR, "shops_backup.json");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Major Japanese cities and districts - COMPREHENSIVE
const JAPAN_LOCATIONS = [
  // ========== TOKYO - All Major Stations & Districts ==========
  // Central Tokyo
  { name: "Tokyo Shinjuku", lat: 35.6938, lng: 139.7034 },
  { name: "Tokyo Shibuya", lat: 35.6598, lng: 139.7006 },
  { name: "Tokyo Ikebukuro", lat: 35.7295, lng: 139.7109 },
  { name: "Tokyo Ueno", lat: 35.7138, lng: 139.7773 },
  { name: "Tokyo Ginza", lat: 35.6719, lng: 139.7659 },
  { name: "Tokyo Roppongi", lat: 35.6627, lng: 139.7314 },
  { name: "Tokyo Akihabara", lat: 35.6984, lng: 139.7731 },
  { name: "Tokyo Harajuku", lat: 35.6702, lng: 139.7027 },
  { name: "Tokyo Asakusa", lat: 35.7148, lng: 139.7967 },
  { name: "Tokyo Omotesando", lat: 35.6675, lng: 139.7103 },
  { name: "Tokyo Shinagawa", lat: 35.6284, lng: 139.7387 },
  { name: "Tokyo Takadanobaba", lat: 35.7128, lng: 139.7038 },
  { name: "Tokyo Tokyo Station", lat: 35.6812, lng: 139.7671 },
  { name: "Tokyo Marunouchi", lat: 35.6812, lng: 139.7671 },
  { name: "Tokyo Otemachi", lat: 35.6816, lng: 139.7676 },
  
  // Yamanote Line Stations
  { name: "Tokyo Yurakucho", lat: 35.6750, lng: 139.7633 },
  { name: "Tokyo Shimbashi", lat: 35.6662, lng: 139.7576 },
  { name: "Tokyo Hamamatsucho", lat: 35.6554, lng: 139.7571 },
  { name: "Tokyo Tamachi", lat: 35.6457, lng: 139.7476 },
  { name: "Tokyo Osaki", lat: 35.6197, lng: 139.7286 },
  { name: "Tokyo Gotanda", lat: 35.6264, lng: 139.7234 },
  { name: "Tokyo Meguro", lat: 35.6339, lng: 139.7156 },
  { name: "Tokyo Ebisu", lat: 35.6467, lng: 139.7100 },
  { name: "Tokyo Hiroo", lat: 35.6500, lng: 139.7167 },
  { name: "Tokyo Azabu-Juban", lat: 35.6581, lng: 139.7236 },
  { name: "Tokyo Kamiyacho", lat: 35.6642, lng: 139.7447 },
  { name: "Tokyo Toranomon", lat: 35.6703, lng: 139.7497 },
  { name: "Tokyo Kanda", lat: 35.6917, lng: 139.7706 },
  { name: "Tokyo Okachimachi", lat: 35.7044, lng: 139.7747 },
  { name: "Tokyo Nippori", lat: 35.7281, lng: 139.7747 },
  { name: "Tokyo Nishi-Nippori", lat: 35.7322, lng: 139.7669 },
  { name: "Tokyo Tabata", lat: 35.7381, lng: 139.7608 },
  { name: "Tokyo Komagome", lat: 35.7364, lng: 139.7453 },
  { name: "Tokyo Sugamo", lat: 35.7333, lng: 139.7392 },
  { name: "Tokyo Otsuka", lat: 35.7314, lng: 139.7281 },
  { name: "Tokyo Mejiro", lat: 35.7211, lng: 139.7069 },
  { name: "Tokyo Nakano", lat: 35.7075, lng: 139.6658 },
  { name: "Tokyo Koenji", lat: 35.7056, lng: 139.6497 },
  { name: "Tokyo Asagaya", lat: 35.7047, lng: 139.6356 },
  { name: "Tokyo Ogikubo", lat: 35.7042, lng: 139.6203 },
  { name: "Tokyo Nishi-Ogikubo", lat: 35.7036, lng: 139.5997 },
  { name: "Tokyo Kichijoji", lat: 35.7031, lng: 139.5797 },
  
  // Other Major Tokyo Areas
  { name: "Tokyo Aoyama", lat: 35.6711, lng: 139.7228 },
  { name: "Tokyo Daikanyama", lat: 35.6481, lng: 139.7036 },
  { name: "Tokyo Jiyugaoka", lat: 35.6064, lng: 139.6681 },
  { name: "Tokyo Nakameguro", lat: 35.6442, lng: 139.6981 },
  { name: "Tokyo Shirokane", lat: 35.6375, lng: 139.7303 },
  { name: "Tokyo Roppongi Hills", lat: 35.6606, lng: 139.7294 },
  { name: "Tokyo Tokyo Skytree", lat: 35.7101, lng: 139.8107 },
  { name: "Tokyo Tsukiji", lat: 35.6653, lng: 139.7706 },
  { name: "Tokyo Tsukishima", lat: 35.6881, lng: 139.7875 },
  { name: "Tokyo Odaiba", lat: 35.6294, lng: 139.7778 },
  { name: "Tokyo Shiodome", lat: 35.6622, lng: 139.7581 },
  { name: "Tokyo Hatchobori", lat: 35.6731, lng: 139.7803 },
  { name: "Tokyo Kyobashi", lat: 35.6775, lng: 139.7703 },
  { name: "Tokyo Nihonbashi", lat: 35.6817, lng: 139.7747 },
  { name: "Tokyo Jimbocho", lat: 35.6958, lng: 139.7578 },
  { name: "Tokyo Suidobashi", lat: 35.7022, lng: 139.7531 },
  { name: "Tokyo Ochanomizu", lat: 35.6997, lng: 139.7653 },
  { name: "Tokyo Yushima", lat: 35.7078, lng: 139.7736 },
  { name: "Tokyo Nezu", lat: 35.7203, lng: 139.7658 },
  { name: "Tokyo Sendagi", lat: 35.7219, lng: 139.7603 },
  { name: "Tokyo Yanaka", lat: 35.7242, lng: 139.7697 },
  { name: "Tokyo Uguisudani", lat: 35.7281, lng: 139.7747 },
  
  // ========== OSAKA - All Major Areas & Stations ==========
  { name: "Osaka Namba", lat: 34.6636, lng: 135.5022 },
  { name: "Osaka Umeda", lat: 34.7054, lng: 135.4983 },
  { name: "Osaka Shinsaibashi", lat: 34.6742, lng: 135.5008 },
  { name: "Osaka Dotonbori", lat: 34.6698, lng: 135.5019 },
  { name: "Osaka Tennoji", lat: 34.6458, lng: 135.5064 },
  { name: "Osaka Namba Station", lat: 34.6636, lng: 135.5022 },
  { name: "Osaka Umeda Station", lat: 34.7054, lng: 135.4983 },
  { name: "Osaka Shinsaibashi Station", lat: 34.6742, lng: 135.5008 },
  { name: "Osaka Nippombashi", lat: 34.6681, lng: 135.5069 },
  { name: "Osaka Honmachi", lat: 34.6819, lng: 135.4981 },
  { name: "Osaka Kyobashi", lat: 34.6969, lng: 135.5069 },
  { name: "Osaka Morinomiya", lat: 34.6819, lng: 135.5319 },
  { name: "Osaka Tamatsukuri", lat: 34.6731, lng: 135.5156 },
  { name: "Osaka Tanimachi", lat: 34.6831, lng: 135.5197 },
  { name: "Osaka Higashi-Umeda", lat: 34.7050, lng: 135.5019 },
  { name: "Osaka Nishi-Umeda", lat: 34.7058, lng: 135.4947 },
  { name: "Osaka Nakatsu", lat: 34.7103, lng: 135.4958 },
  { name: "Osaka Juso", lat: 34.7203, lng: 135.4958 },
  { name: "Osaka Fukushima", lat: 34.6958, lng: 135.4869 },
  { name: "Osaka Nishinari", lat: 34.6503, lng: 135.5003 },
  { name: "Osaka Shin-Imamiya", lat: 34.6442, lng: 135.5019 },
  { name: "Osaka Abeno", lat: 34.6447, lng: 135.5069 },
  { name: "Osaka Tsuruhashi", lat: 34.6658, lng: 135.5069 },
  { name: "Osaka Imamiya", lat: 34.6503, lng: 135.5003 },
  { name: "Osaka Bentencho", lat: 34.6603, lng: 135.4958 },
  { name: "Osaka Ashiharabashi", lat: 34.6731, lng: 135.4958 },
  { name: "Osaka Kujo", lat: 34.6831, lng: 135.4958 },
  { name: "Osaka Nishikujo", lat: 34.6931, lng: 135.4858 },
  { name: "Osaka Taisho", lat: 34.6703, lng: 135.4858 },
  { name: "Osaka Ajikawaguchi", lat: 34.6803, lng: 135.4758 },
  { name: "Osaka Temma", lat: 34.7019, lng: 135.5019 },
  { name: "Osaka Osaka Castle", lat: 34.6873, lng: 135.5259 },
  { name: "Osaka Universal Studios", lat: 34.6656, lng: 135.4322 },
  { name: "Osaka Shin-Osaka", lat: 34.7339, lng: 135.5003 },
  { name: "Osaka Yodoyabashi", lat: 34.6919, lng: 135.5019 },
  { name: "Osaka Kitahama", lat: 34.6869, lng: 135.5069 },
  { name: "Osaka Sakaisuji-Hommachi", lat: 34.6819, lng: 135.4981 },
  { name: "Osaka Awaza", lat: 34.6769, lng: 135.4931 },
  { name: "Osaka Noda", lat: 34.6719, lng: 135.4881 },
  { name: "Osaka Daikokucho", lat: 34.6669, lng: 135.4831 },
  { name: "Osaka Dobutsuen-Mae", lat: 34.6619, lng: 135.4781 },
  { name: "Osaka Ebisucho", lat: 34.6569, lng: 135.4731 },
  { name: "Osaka Tengachaya", lat: 34.6519, lng: 135.4681 },
  
  // ========== KYOTO - All Major Areas & Stations ==========
  { name: "Kyoto Station", lat: 34.9858, lng: 135.7581 },
  { name: "Kyoto Gion", lat: 35.0024, lng: 135.7736 },
  { name: "Kyoto Kawaramachi", lat: 35.0050, lng: 135.7689 },
  { name: "Kyoto Shijo", lat: 35.0036, lng: 135.7681 },
  { name: "Kyoto Sanjo", lat: 35.0086, lng: 135.7703 },
  { name: "Kyoto Karasuma", lat: 35.0031, lng: 135.7619 },
  { name: "Kyoto Oike", lat: 35.0103, lng: 135.7619 },
  { name: "Kyoto Marutamachi", lat: 35.0156, lng: 135.7619 },
  { name: "Kyoto Imadegawa", lat: 35.0208, lng: 135.7619 },
  { name: "Kyoto Kitaoji", lat: 35.0419, lng: 135.7531 },
  { name: "Kyoto Nijo", lat: 35.0131, lng: 135.7481 },
  { name: "Kyoto Toji", lat: 34.9803, lng: 135.7481 },
  { name: "Kyoto Fushimi-Inari", lat: 34.9672, lng: 135.7725 },
  { name: "Kyoto Kiyomizu", lat: 34.9947, lng: 135.7853 },
  { name: "Kyoto Higashiyama", lat: 35.0003, lng: 135.7781 },
  { name: "Kyoto Arashiyama", lat: 35.0094, lng: 135.6781 },
  { name: "Kyoto Sagano", lat: 35.0156, lng: 135.6731 },
  { name: "Kyoto Uzumasa", lat: 35.0103, lng: 135.7031 },
  { name: "Kyoto Nishioji", lat: 35.0031, lng: 135.7231 },
  { name: "Kyoto Gojo", lat: 34.9981, lng: 135.7681 },
  { name: "Kyoto Shichijo", lat: 34.9906, lng: 135.7681 },
  { name: "Kyoto Rokujo", lat: 34.9831, lng: 135.7681 },
  { name: "Kyoto Hachijo", lat: 34.9756, lng: 135.7681 },
  { name: "Kyoto Jujo", lat: 34.9681, lng: 135.7681 },
  { name: "Kyoto Kujo", lat: 34.9606, lng: 135.7681 },
  { name: "Kyoto Tofukuji", lat: 34.9753, lng: 135.7736 },
  { name: "Kyoto Takeda", lat: 34.9681, lng: 135.7781 },
  { name: "Kyoto Fushimi-Momoyama", lat: 34.9331, lng: 135.7681 },
  { name: "Kyoto Yamashina", lat: 34.9503, lng: 135.8131 },
  { name: "Kyoto Demachiyanagi", lat: 35.0319, lng: 135.7731 },
  { name: "Kyoto Keage", lat: 35.0081, lng: 135.7919 },
  { name: "Kyoto Higashiyama Station", lat: 35.0003, lng: 135.7781 },
  { name: "Kyoto Gion-Shijo", lat: 35.0024, lng: 135.7736 },
  { name: "Kyoto Shijo-Kawaramachi", lat: 35.0050, lng: 135.7689 },
  { name: "Kyoto Sanjo-Keihan", lat: 35.0086, lng: 135.7703 },
  { name: "Kyoto Marutamachi Station", lat: 35.0156, lng: 135.7619 },
  { name: "Kyoto Imadegawa Station", lat: 35.0208, lng: 135.7619 },
  { name: "Kyoto Kitaoji Station", lat: 35.0419, lng: 135.7531 },
];

// Comprehensive search terms for ALL categories - EXPANDED FOR 100K SHOPS
const SEARCH_TERMS = [
  // Beauty & Hair - Expanded
  "美容室", "ヘアサロン", "hair salon", "beauty salon",
  "美容院", "ヘアカット", "カットサロン", "美容", "理容",
  "メンズサロン", "レディースサロン", "カラー", "パーマ",
  "理髪店", "理容室", "barbershop", "barber shop",
  "ヘアスタイル", "カット", "トリートメント", "ヘアカラー",
  
  // Nail - Expanded
  "ネイルサロン", "nail salon", "manicure",
  "ネイル", "ジェルネイル", "ネイルアート", "ネイルケア",
  "ネイル専門", "ネイルサロン", "ネイルスタジオ",
  
  // Eyelash - Expanded
  "まつげエクステ", "eyelash", "lash extension",
  "まつ毛", "まつげ", "ラッシュ", "アイラッシュ",
  "まつげエクステンション", "まつげサロン", "ラッシュリフト",
  
  // Spa & Massage - Expanded
  "エステ", "spa", "massage", "マッサージ",
  "整体", "リラクゼーション", "リフレクソロジー", "アロマ",
  "エステティック", "フェイシャル", "ボディケア",
  "リンパマッサージ", "タイマッサージ", "アロママッサージ",
  "脱毛", "レーザー脱毛", "ワックス脱毛",
  
  // Dental - Expanded
  "歯科", "歯科医院", "歯科クリニック", "dentist", "dental clinic",
  "デンタル", "歯医者", "orthodontist", "歯科矯正",
  "歯科診療所", "インプラント", "ホワイトニング",
  "小児歯科", "矯正歯科", "口腔外科", "歯科口腔外科",
  "審美歯科", "予防歯科", "歯周病", "歯科検診",
  
  // Women's Clinic - Expanded
  "婦人科", "産婦人科", "女性クリニック", "gynecology", "women's clinic",
  "レディースクリニック", "女性診療", "obstetrics", "産科",
  "不妊治療", "ピル処方", "婦人科医院", "産科医院",
  "レディース", "女性専門", "婦人科診療",
  
  // Aesthetic & Cosmetic - NEW
  "美容外科", "形成外科", "美容クリニック", "美容皮膚科",
  "シミ取り", "シワ取り", "レーザー治療", "ボトックス",
  "ヒアルロン酸", "脂肪吸引", "二重", "目元",
  
  // Skin Care - NEW
  "皮膚科", "皮膚科医院", "皮膚科クリニック", "dermatology",
  "アトピー", "ニキビ", "シミ", "シワ", "美白",
  
  // General medical - Expanded (only booking-required clinics)
  "クリニック", "clinic", "医院", "診療所",
  "サロン", "スタジオ", "ビューティーサロン",
  
  // Hotels & Ryokan - NEW NATIONWIDE
  "ホテル", "hotel", "旅館", "ryokan", "民宿", "minshuku",
  "リゾート", "resort", "旅宿", "宿泊", "旅亭", "料亭",
  "温泉旅館", "ビジネスホテル", "シティホテル", "inn", "lodge",
  "guesthouse", "旅館", "旅宿施設", "ホテル", "宿泊施設",
  
  // Restaurants & Izakaya - NEW NATIONWIDE (booking required only, no walk-in places)
  "レストラン", "restaurant", "居酒屋", "izakaya", "dining",
  "飲食店", "料理店", "和食", "洋食", "中華", "焼肉", "寿司",
  "bistro", "居酒屋", "レストラン",
  
  // Spas, Onsen & Day-use Bathhouses - NEW NATIONWIDE
  "スパ", "spa", "温泉", "onsen", "銭湯", "sentō", "sento", "サウナ", "sauna",
  "岩盤浴", "日帰り温泉", "天然温泉", "健康ランド", "スーパー銭湯",
  "温浴施設", "湯治場", "共同浴場", "hot spring", "bathhouse", "public bath",
  "温泉", "入浴施設", "温浴", "スパ施設",
  
  // Golf Courses & Practice Ranges - NEW NATIONWIDE
  "ゴルフ", "golf", "ゴルフ場", "golf course", "練習場", "driving range",
  "practice range", "打ちっぱなし", "ゴルフ練習場", "ゴルフクラブ", "golf club",
  "ゴルフ場", "練習場", "ゴルフコース",
  
  // Private Karaoke Rooms - NEW NATIONWIDE
  "カラオケ", "karaoke", "カラオケボックス", "karaoke box", "カラオケルーム",
  "k-box", "ボーカル", "カラオケ", "カラオケ店",
];

// Category mapping function
async function getCategoryId(categoryName: string): Promise<string | null> {
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("name", categoryName)
    .single();
  return data?.id || null;
}

// Auto-categorize shop - EXPANDED FOR NEW CATEGORIES
function categorizeShop(name: string, address: string): string {
  const nameLower = name.toLowerCase();
  const addressLower = address.toLowerCase();
  const combined = `${nameLower} ${addressLower}`;
  
  // EXCLUDE NON-BOOKING BUSINESSES early (return Unknown to be filtered out)
  // Konbini/convenience stores
  if (combined.match(/コンビニ|コンビニエンスストア|konbini|convenience store|convenience/i)) {
    return "Unknown";
  }
  
  // Supermarkets (but allow スーパー銭湯 - super sento)
  if (combined.match(/スーパーマーケット|スーパーストア|supermarket|grocery store|grocery/i) && 
      !combined.match(/スーパー銭湯|super.*sento|super.*sentō/i)) {
    return "Unknown";
  }
  
  // Retail stores (but allow beauty/salon shops)
  if (combined.match(/\b(shop|store|retail|小売|販売店|雑貨店|ドラッグストア|drugstore|pharmacy|薬局)\b/i) &&
      !combined.match(/(beauty|salon|hairdresser|nail|ネイル|美容|ヘア|サロン)/i)) {
    return "Unknown";
  }
  
  // Fast food and walk-in restaurants
  if (combined.match(/fast food|takeout|take.out|drive.through|drive.thru|ファストフード|テイクアウト|食堂|shokudo|ラーメン|ramen|うどん|udon|そば|soba|立ち食い|立ち飲み/i)) {
    return "Unknown";
  }
  
  // Hospitals
  if (combined.match(/\b(hospital|病院|総合病院|大学病院)\b/i)) {
    return "Unknown";
  }
  
  // Gyms and fitness centers
  if (combined.match(/\b(gym|fitness|ジム|フィットネス|スポーツクラブ|sports club|fitness centre|fitness center)\b/i)) {
    return "Unknown";
  }
  
  // Public pools and water parks
  if (combined.match(/\b(swimming pool|プール|水泳場|water park|ウォーターパーク)\b/i)) {
    return "Unknown";
  }
  
  // Camping sites
  if (combined.match(/\b(camp site|campsite|camping|キャンプ場|キャンピング)\b/i)) {
    return "Unknown";
  }
  
  // Tourism apartments
  if (combined.match(/\b(tourism apartment|apartment|アパート|マンション|rental apartment)\b/i)) {
    return "Unknown";
  }
  
  // Most specific first - NEW NATIONWIDE CATEGORIES
  // Private Karaoke Rooms (very specific)
  if (combined.match(/karaoke|カラオケ|カラオケボックス|カラオケルーム|ボーカル/)) return "Private Karaoke Rooms";
  
  // Golf Courses & Practice Ranges (very specific)
  if (combined.match(/golf|ゴルフ|ゴルフ場|練習場|打ちっぱなし|ゴルフ練習場|ゴルフクラブ/)) return "Golf Courses & Practice Ranges";
  
  // Spas, Onsen & Day-use Bathhouses (specific - check before general spa)
  if (combined.match(/onsen|温泉|銭湯|サウナ|岩盤浴|日帰り温泉|天然温泉|健康ランド|スーパー銭湯|温浴施設|湯治場|共同浴場|hot spring|bathhouse|public bath|sentō|sento/)) return "Spas, Onsen & Day-use Bathhouses";
  
  // Hotels & Ryokan (specific)
  if (combined.match(/hotel|ryokan|inn|resort|lodge|guesthouse|minshuku|ホテル|旅館|民宿|リゾート|旅宿|宿泊|旅亭|料亭|温泉旅館|ビジネスホテル|シティホテル/)) return "Hotels & Ryokan";
  
  // Restaurants & Izakaya (specific - booking required only, no bars/cafes, no walk-in places)
  if (combined.match(/restaurant|izakaya|dining|bistro|レストラン|居酒屋|飲食店|料理店|和食|洋食|中華|焼肉|寿司/)) return "Restaurants & Izakaya";
  
  // ORIGINAL SALON CATEGORIES (keep existing logic)
  if (combined.match(/eyelash|lash|まつげ|エクステ|ラッシュ|アイラッシュ/)) return "Eyelash";
  if (combined.match(/nail|ネイル|マニキュア|ジェルネイル/)) return "Nail Salon";
  if (combined.match(/barber|理髪|理容/)) return "Barbershop";
  if (combined.match(/dental|dentist|歯科|デンタル|歯医者|インプラント|矯正歯科/)) return "Dental Clinic";
  if (combined.match(/gynecology|gynecologist|婦人科|産婦人科|女性クリニック|レディース|不妊治療/)) return "Women's Clinic";
  if (combined.match(/dermatology|皮膚科|アトピー|ニキビ|シミ|美白/)) return "Beauty Salon"; // Skin care
  if (combined.match(/美容外科|形成外科|美容クリニック|美容皮膚科|シミ取り|シワ取り|ボトックス|ヒアルロン酸|脂肪吸引/)) return "Beauty Salon"; // Aesthetic
  if (combined.match(/spa|massage|エステ|マッサージ|therapy|整体|リラクゼーション|脱毛/)) return "Spa & Massage";
  if (combined.match(/hair|ヘア|美容室|カット|パーマ|ヘアカラー/)) return "Hair Salon";
  if (combined.match(/beauty|cosmetic|美容|コスメ|サロン/)) return "Beauty Salon";
  
  return "Unknown";
}

// Check for duplicate shop - PRIORITIZE osm_id check
async function isDuplicate(shop: any): Promise<{ isDuplicate: boolean; existingId?: string; reason?: string }> {
  // PRIMARY CHECK: OSM ID (most reliable unique identifier)
  if (shop.osm_id) {
    const { data } = await supabase
      .from("shops")
      .select("id")
      .eq("osm_id", shop.osm_id.toString())
      .maybeSingle();
    if (data) {
      return { isDuplicate: true, existingId: data.id, reason: "osm_id match" };
    }
  }
  
  // Check by coordinates (within 50m)
  if (shop.latitude && shop.longitude) {
    const radius = 0.00045; // ~50 meters
    const { data } = await supabase
      .from("shops")
      .select("id, name, latitude, longitude")
      .gte("latitude", shop.latitude - radius)
      .lte("latitude", shop.latitude + radius)
      .gte("longitude", shop.longitude - radius)
      .lte("longitude", shop.longitude + radius)
      .limit(5);
    
    if (data && data.length > 0) {
      // Check exact match (within 10m)
      const exact = data.find((s) => {
        if (!s.latitude || !s.longitude) return false;
        const latDiff = Math.abs(s.latitude - shop.latitude);
        const lngDiff = Math.abs(s.longitude - shop.longitude);
        return latDiff < 0.0001 && lngDiff < 0.0001;
      });
      if (exact) return { isDuplicate: true, existingId: exact.id };
      
      // Check name similarity
      const nameMatch = data.find((s) => {
        const similarity = calculateSimilarity(s.name.toLowerCase(), shop.name.toLowerCase());
        return similarity > 0.8;
      });
      if (nameMatch) return { isDuplicate: true, existingId: nameMatch.id };
    }
  }
  
  // Check by name similarity
  const { data } = await supabase
    .from("shops")
    .select("id, name")
    .ilike("name", `%${shop.name.substring(0, 10)}%`)
    .limit(10);
  
  if (data) {
    const exactName = data.find((s) => s.name.toLowerCase().trim() === shop.name.toLowerCase().trim());
    if (exactName) return { isDuplicate: true, existingId: exactName.id };
  }
  
  return { isDuplicate: false };
}

function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.includes(shorter)) return shorter.length / longer.length;
  return 0;
}

// Search OpenStreetMap with retry logic and pagination - OPTIMIZED VIEWBOX
async function searchOSM(query: string, location: { lat: number; lng: number; name: string }, limit = 200, retries = 3, offset = 0): Promise<any[]> {
  const baseUrl = "https://nominatim.openstreetmap.org/search";
  
  // Dynamic viewbox size: larger for major cities, standard for others
  const isMajorCity = location.name.includes('Tokyo') || 
                      location.name.includes('Osaka') || 
                      location.name.includes('Kyoto') ||
                      location.name.includes('Yokohama') ||
                      location.name.includes('Nagoya') ||
                      location.name.includes('Sapporo') ||
                      location.name.includes('Fukuoka');
  const viewboxSize = isMajorCity ? 1.0 : 0.5; // Larger radius for major cities
  
  const params = new URLSearchParams({
    q: `${query} ${location.name}`,
    format: "json",
    addressdetails: "1",
    limit: limit.toString(),
    offset: offset.toString(),
    countrycodes: "jp",
    dedupe: "1",
    viewbox: `${location.lng - viewboxSize},${location.lat - viewboxSize},${location.lng + viewboxSize},${location.lat + viewboxSize}`,
    bounded: "1",
  });
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        headers: {
          'User-Agent': 'Yoyaku-Yo-Japan-Shop-Importer/1.0',
        },
      });
      
      if (response.status === 503 || response.status === 429) {
        // Rate limited or service unavailable - retry with exponential backoff
        if (attempt < retries - 1) {
          const waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
          console.warn(`⚠️  OSM API ${response.status} - Retrying in ${waitTime/1000}s... (attempt ${attempt + 1}/${retries})`);
          await sleep(waitTime);
          continue; // Retry
        } else {
          console.warn(`⚠️  OSM API ${response.status} - Max retries reached, skipping this search`);
          return [];
        }
      }
      
      if (!response.ok) {
        console.warn(`⚠️  OSM API error: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (attempt < retries - 1) {
        const waitTime = Math.pow(2, attempt) * 2000;
        console.warn(`⚠️  Network error - Retrying in ${waitTime/1000}s... (attempt ${attempt + 1}/${retries})`);
        await sleep(waitTime);
        continue;
      } else {
        console.error(`❌ Error searching OSM after ${retries} attempts:`, error);
        return [];
      }
    }
  }
  
  return [];
}

// Query shops directly via Overpass API (more efficient for bulk queries)
async function queryShopsViaOverpass(location: { lat: number; lng: number; name: string }, radiusKm = 5): Promise<any[]> {
  const overpassUrl = "https://overpass-api.de/api/interpreter";
  
  // Query for all relevant shop types within radius - EXPANDED FOR NEW CATEGORIES
  const overpassQuery = `
    [out:json][timeout:300];
    (
      node["amenity"~"^(beauty|dentist|clinic|doctors|hotel|restaurant|spa|golf_course|karaoke_box|sauna|public_bath|bathhouse|hot_spring|onsen|resort)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      way["amenity"~"^(beauty|dentist|clinic|doctors|hotel|restaurant|spa|golf_course|karaoke_box|sauna|public_bath|bathhouse|hot_spring|onsen|resort)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      relation["amenity"~"^(beauty|dentist|clinic|doctors|hotel|restaurant|spa|golf_course|karaoke_box|sauna|public_bath|bathhouse|hot_spring|onsen|resort)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      node["shop"~"^(beauty|hairdresser)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      way["shop"~"^(beauty|hairdresser)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      relation["shop"~"^(beauty|hairdresser)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      node["office"~"^(dentist|doctor|beauty)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      way["office"~"^(dentist|doctor|beauty)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      node["tourism"~"^(hotel|hostel|guest_house|resort|chalet|motel|ryokan)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      way["tourism"~"^(hotel|hostel|guest_house|resort|chalet|motel|ryokan)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      relation["tourism"~"^(hotel|hostel|guest_house|resort|chalet|motel|ryokan)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      node["leisure"~"^(golf_course|driving_range|miniature_golf|sauna|spa|beach_resort|resort)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      way["leisure"~"^(golf_course|driving_range|miniature_golf|sauna|spa|beach_resort|resort)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
      relation["leisure"~"^(golf_course|driving_range|miniature_golf|sauna|spa|beach_resort|resort)$"](around:${radiusKm * 1000},${location.lat},${location.lng});
    );
    out center;
  `;
  
  try {
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Yoyaku-Yo-Japan-Shop-Importer/1.0',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json() as { elements?: any[] };
    const elements = data.elements || [];
    
    // Convert Overpass elements to Nominatim-like format
    return elements.map(element => {
      const tags = element.tags || {};
      let lat: number, lng: number;
      
      if (element.type === 'node') {
        lat = element.lat;
        lng = element.lon;
      } else if (element.center) {
        lat = element.center.lat;
        lng = element.center.lon;
      } else {
        return null;
      }
      
      const name = tags['name:en'] || tags.name || tags['name:ja'] || '';
      const address = [
        tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
        tags['addr:prefecture'] || tags['addr:state'],
        'Japan'
      ].filter(Boolean).join(', ');
      
      return {
        osm_id: element.id,
        osm_type: element.type,
        lat: lat.toString(),
        lon: lng.toString(),
        display_name: name ? `${name}, ${address}` : address,
        address: {
          city: tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
          country: 'Japan',
          postcode: tags['addr:postcode'],
        },
        tags: tags,
      };
    }).filter(Boolean) as any[];
  } catch (error) {
    console.warn(`⚠️  Overpass query error for ${location.name}:`, error);
    return [];
  }
}

// Search with pagination to get all results - INCREASED FOR 100K SHOPS
async function searchOSMWithPagination(query: string, location: { lat: number; lng: number; name: string }, maxResults = 5000): Promise<any[]> {
  const allResults: any[] = [];
  const limit = 200; // Nominatim max per request
  let offset = 0;
  
  while (allResults.length < maxResults) {
    const results = await searchOSM(query, location, limit, 3, offset);
    if (results.length === 0) break; // No more results
    allResults.push(...results);
    if (results.length < limit) break; // Last page
    offset += limit;
    await sleep(2000); // Rate limit between pages
  }
  
  return allResults;
}

// Load checkpoint
function loadCheckpoint(): Set<string> {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const data = fs.readFileSync(CHECKPOINT_FILE, 'utf-8');
      const checkpoint = JSON.parse(data);
      console.log(`📂 Resuming from checkpoint: ${checkpoint.processed?.length || 0} location+term combinations already processed`);
      return new Set(checkpoint.processed || []);
    }
  } catch (error) {
    console.warn("⚠️  Could not load checkpoint, starting fresh");
  }
  return new Set<string>();
}

// Save checkpoint
function saveCheckpoint(processed: Set<string>) {
  try {
    const checkpoint = {
      processed: Array.from(processed),
      timestamp: new Date().toISOString(),
    };
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  } catch (error) {
    console.warn("⚠️  Could not save checkpoint:", error);
  }
}

// Load shops dataset from local file
function loadLocalDataset(): Map<string, any> | null {
  try {
    if (fs.existsSync(DATASET_FILE)) {
      const fileContent = fs.readFileSync(DATASET_FILE, 'utf-8');
      const data = JSON.parse(fileContent);
      
      // Convert array back to Map
      const shopsMap = new Map<string, any>();
      if (Array.isArray(data.shops)) {
        for (const shop of data.shops) {
          if (shop.osm_id) {
            shopsMap.set(shop.osm_id, shop);
          }
        }
      }
      
      console.log(`📂 Loaded ${shopsMap.size} shops from local dataset`);
      console.log(`   File: ${DATASET_FILE}`);
      console.log(`   Saved: ${data.timestamp || 'unknown'}`);
      return shopsMap;
    }
  } catch (error) {
    console.warn("⚠️  Could not load local dataset:", error);
  }
  return null;
}

// Save shops dataset to local file
function saveLocalDataset(shops: Map<string, any>) {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Convert Map to array for JSON serialization
    const shopsArray = Array.from(shops.values());
    
    const dataset = {
      shops: shopsArray,
      count: shopsArray.length,
      timestamp: new Date().toISOString(),
      source: "OpenStreetMap/Nominatim",
    };
    
    fs.writeFileSync(DATASET_FILE, JSON.stringify(dataset, null, 2));
    console.log(`💾 Saved ${shops.size} shops to local dataset`);
    console.log(`   File: ${DATASET_FILE}`);
  } catch (error) {
    console.warn("⚠️  Could not save local dataset:", error);
  }
}

// Statistics
const stats = {
  totalFound: 0,
  duplicates: 0,
  inserted: 0,
  errors: 0,
  skipped: 0,
  byCategory: {} as Record<string, number>,
};

// Sleep function (respect Nominatim rate limit: 1 req/sec)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch all Japanese cities/towns with population > 1000 using Overpass API
async function fetchAllJapaneseCities(): Promise<Array<{name: string, lat: number, lng: number}>> {
  console.log("🌏 Fetching all Japanese cities with >1000 inhabitants from OpenStreetMap...\n");
  
  const cities: Array<{name: string, lat: number, lng: number}> = [];
  const cityCacheFile = path.resolve(__dirname, "../../japanese_cities_cache.json");
  
  // Check if we have a cached list
  if (fs.existsSync(cityCacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cityCacheFile, 'utf-8'));
      if (cached.cities && cached.cities.length > 0) {
        console.log(`✓ Using cached city list: ${cached.cities.length} cities (from ${cached.timestamp})`);
        return cached.cities;
      }
    } catch (error) {
      console.warn("⚠️  Could not load cached cities, fetching fresh...");
    }
  }
  
  // Use Overpass API for comprehensive city search
  const overpassUrl = "https://overpass-api.de/api/interpreter";
  
  // Query for all cities, towns, and villages in Japan
  // We'll filter by population in code since Overpass population comparison can be tricky
  const overpassQuery = `
    [out:json][timeout:600];
    (
      relation["place"~"^(city|town|village)$"]["ISO3166-1"="JP"];
      relation["place"~"^(city|town|village)$"]["addr:country"="JP"];
      node["place"~"^(city|town|village)$"]["ISO3166-1"="JP"];
      node["place"~"^(city|town|village)$"]["addr:country"="JP"];
      way["place"~"^(city|town|village)$"]["ISO3166-1"="JP"];
      way["place"~"^(city|town|village)$"]["addr:country"="JP"];
    );
    out center;
  `;
  
  try {
    console.log("  📡 Querying Overpass API (this may take a few minutes)...");
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Yoyaku-Yo-Japan-Shop-Importer/1.0',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });
    
    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }
    
    const data = await response.json() as { elements?: any[] };
    const elements = data.elements || [];
    
    console.log(`  ✓ Found ${elements.length} places from Overpass API`);
    
    // Process elements and extract city information
    const cityMap = new Map<string, {name: string, lat: number, lng: number}>();
    
    for (const element of elements) {
      const placeType = element.tags?.place || '';
      const population = parseInt(element.tags?.population || '0');
      
      // Include if:
      // 1. Population > 1000, OR
      // 2. It's a city (cities typically have >1000), OR
      // 3. It's a town (towns typically have >1000)
      // Exclude villages unless they have explicit population > 1000
      if (placeType === 'village' && population <= 1000) continue;
      if (placeType === 'town' && population > 0 && population <= 1000) continue;
      if (placeType === 'city') {
        // Cities are always included (they're major population centers)
      } else if (population <= 1000) {
        continue;
      }
      
      const name = element.tags?.['name:en'] || element.tags?.name || element.tags?.['name:ja'] || '';
      if (!name) continue;
      
      let lat: number, lng: number;
      
      if (element.type === 'node') {
        lat = element.lat;
        lng = element.lon;
      } else if (element.center) {
        lat = element.center.lat;
        lng = element.center.lon;
      } else if (element.lat && element.lon) {
        lat = element.lat;
        lng = element.lon;
      } else {
        continue; // Skip if no coordinates
      }
      
      // Use name as key to avoid duplicates
      const key = name.toLowerCase().trim();
      if (!cityMap.has(key)) {
        cityMap.set(key, { name, lat, lng });
      }
    }
    
    const uniqueCities = Array.from(cityMap.values());
    console.log(`  ✓ Extracted ${uniqueCities.length} unique cities with >1000 inhabitants`);
    
    // Also use Nominatim as a fallback to catch cities that might not have population tags
    console.log("  📡 Querying Nominatim for additional cities (comprehensive search)...");
    
    const placeTypes = ['city', 'town'];
    for (const placeType of placeTypes) {
      let offset = 0;
      const limit = 50;
      let hasMore = true;
      
      while (hasMore) {
        const params = new URLSearchParams({
          q: `[place=${placeType}]`,
          format: "json",
          addressdetails: "1",
          limit: limit.toString(),
          offset: offset.toString(),
          countrycodes: "jp",
          dedupe: "1",
        });
        
        try {
          const nomResponse = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
            headers: {
              'User-Agent': 'Yoyaku-Yo-Japan-Shop-Importer/1.0',
            },
          });
          
          if (!nomResponse.ok) break;
          
          const nomData = await nomResponse.json();
          if (!Array.isArray(nomData) || nomData.length === 0) {
            hasMore = false;
            break;
          }
          
          for (const place of nomData) {
            const population = parseInt(place.address?.population || place.population || '0');
            const placeTypeFromPlace = place.type || place.class || '';
            // Include if population > 1000 OR if it's a city/town (they usually have >1000)
            // For places without population data, include cities and towns (they typically have >1000)
            if (population > 1000 || placeType === 'city' || placeType === 'town') {
              const cityName = place.address?.city || place.address?.town || place.display_name.split(',')[0];
              const key = cityName.toLowerCase().trim();
              
              if (!cityMap.has(key)) {
                cityMap.set(key, {
                  name: cityName,
                  lat: parseFloat(place.lat),
                  lng: parseFloat(place.lon),
                });
              }
            }
          }
          
          if (nomData.length < limit) hasMore = false;
          else offset += limit;
          
          await sleep(2000); // Rate limit
        } catch (error) {
          console.warn(`  ⚠️  Error fetching ${placeType} from Nominatim:`, error);
          hasMore = false;
        }
      }
    }
    
    const finalCities = Array.from(cityMap.values());
    console.log(`  ✓ Total unique cities found: ${finalCities.length}\n`);
    
    // Cache the results
    try {
      fs.writeFileSync(cityCacheFile, JSON.stringify({
        cities: finalCities,
        timestamp: new Date().toISOString(),
        count: finalCities.length,
      }, null, 2));
      console.log(`  💾 Cached city list to ${cityCacheFile}\n`);
    } catch (error) {
      console.warn("  ⚠️  Could not cache city list:", error);
    }
    
    return finalCities;
  } catch (error) {
    console.error("❌ Error fetching cities from Overpass API:", error);
    console.log("  ⚠️  Falling back to Nominatim-only search...\n");
    
    // Fallback: Use Nominatim to search for major cities
    const fallbackCities: Array<{name: string, lat: number, lng: number}> = [];
    const majorCityNames = [
      "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto",
      "Sendai", "Hiroshima", "Chiba", "Kitakyushu", "Saitama", "Niigata", "Hamamatsu",
      "Shizuoka", "Okayama", "Kumamoto", "Kagoshima", "Utsunomiya", "Matsuyama",
      "Himeji", "Kanazawa", "Nagano", "Toyama", "Gifu", "Fukui", "Tottori", "Matsue",
      "Kofu", "Yamanashi", "Mito", "Urawa", "Kawasaki", "Sagamihara", "Yokosuka",
      "Chigasaki", "Fujisawa", "Kamakura", "Odawara", "Atami", "Numazu", "Shizuoka",
      "Hamamatsu", "Toyohashi", "Okazaki", "Nagoya", "Gifu", "Takayama", "Kanazawa",
      "Fukui", "Tsuruga", "Maizuru", "Kyoto", "Nara", "Osaka", "Kobe", "Himeji",
      "Okayama", "Kurashiki", "Fukuyama", "Hiroshima", "Yamaguchi", "Shimonoseki",
      "Tokushima", "Takamatsu", "Matsuyama", "Kochi", "Fukuoka", "Kitakyushu",
      "Saga", "Nagasaki", "Kumamoto", "Oita", "Miyazaki", "Kagoshima", "Naha"
    ];
    
    for (const cityName of majorCityNames) {
      try {
        const params = new URLSearchParams({
          q: `${cityName} Japan`,
          format: "json",
          addressdetails: "1",
          limit: "1",
          countrycodes: "jp",
        });
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: {
            'User-Agent': 'Yoyaku-Yo-Japan-Shop-Importer/1.0',
          },
        });
        
        if (response.ok) {
          const data = await response.json() as any[];
          if (data && data.length > 0) {
            const place = data[0];
            fallbackCities.push({
              name: place.address?.city || place.address?.town || cityName,
              lat: parseFloat(place.lat),
              lng: parseFloat(place.lon),
            });
          }
        }
        
        await sleep(2000);
      } catch (error) {
        console.warn(`  ⚠️  Error fetching ${cityName}:`, error);
      }
    }
    
    return fallbackCities;
  }
}

// Main import function
async function importJapanShops() {
  console.log("🚀 Starting Japan-wide Shop Importer (OpenStreetMap)\n");
  
  // Check if local dataset exists
  let allShops: Map<string, any> | null = loadLocalDataset();
  let useLocalDataset = allShops !== null;
  let allLocations: Array<{name: string, lat: number, lng: number}> = [];
  
  if (useLocalDataset && allShops) {
    console.log("✅ USING LOCAL DATASET");
    console.log("   Skipping API requests, using cached data\n");
  } else {
    console.log("🌐 FETCHING FROM OSM");
    console.log("   No local dataset found, fetching from OpenStreetMap API\n");
    
    // Fetch all Japanese cities with >1000 inhabitants
    const japaneseCities = await fetchAllJapaneseCities();
    
    // Combine existing locations with all Japanese cities
    allLocations = [...JAPAN_LOCATIONS, ...japaneseCities];
    
    console.log(`📍 Total locations to search: ${allLocations.length}`);
    console.log(`   - Predefined locations: ${JAPAN_LOCATIONS.length}`);
    console.log(`   - Japanese cities (>1000 pop): ${japaneseCities.length}`);
    console.log(`🔍 Using ${SEARCH_TERMS.length} search terms\n`);
    console.log("⏳ This will take a while (respecting rate limits)...\n");
    
    // Load checkpoint
    const processedSearches = loadCheckpoint();
    
    allShops = new Map<string, any>(); // Use OSM ID as key to avoid duplicates
    
    // Phase 1: Search all locations
    for (let locIndex = 0; locIndex < allLocations.length; locIndex++) {
      const location = allLocations[locIndex];
    console.log(`\n📍 [${locIndex + 1}/${allLocations.length}] Processing: ${location.name}`);
    console.log("─".repeat(60));
    
    for (let termIndex = 0; termIndex < SEARCH_TERMS.length; termIndex++) {
      const term = SEARCH_TERMS[termIndex];
      const checkpointKey = `${location.name}::${term}`;
      
      // Skip if already processed
      if (processedSearches.has(checkpointKey)) {
        console.log(`  ⏭️  [${termIndex + 1}/${SEARCH_TERMS.length}] Skipping (already processed): "${term}"`);
        stats.skipped++;
        continue;
      }
      
      console.log(`  🔍 [${termIndex + 1}/${SEARCH_TERMS.length}] Searching: "${term}"`);
      
      // Use Overpass API for major cities (faster and more comprehensive)
      const isMajorCity = location.name.includes('Tokyo') || 
                          location.name.includes('Osaka') || 
                          location.name.includes('Kyoto') ||
                          location.name.includes('Yokohama') ||
                          location.name.includes('Nagoya') ||
                          location.name.includes('Sapporo') ||
                          location.name.includes('Fukuoka');
      
      let results: any[] = [];
      
      // For major cities, use Overpass API first (more comprehensive)
      if (isMajorCity && termIndex === 0) {
        // Use Overpass for first search term to get all shops in area
        const overpassResults = await queryShopsViaOverpass(location, 10); // 10km radius for major cities
        results.push(...overpassResults);
        await sleep(2000); // Rate limit
      }
      
      // Also use Nominatim search with pagination (up to 5000 results)
      const nominatimResults = await searchOSMWithPagination(term, location, 5000);
      results.push(...nominatimResults);
      
      stats.totalFound += results.length;
      
      for (const place of results) {
        const osmId = place.osm_id?.toString();
        if (!osmId || allShops.has(osmId)) continue;
        
        // Handle both Nominatim and Overpass formats
        const displayName = place.display_name || '';
        const name = displayName.split(',')[0].trim() || place.tags?.name || '';
        const address = displayName || place.address || '';
        const lat = parseFloat(place.lat || place.latitude);
        const lng = parseFloat(place.lon || place.longitude);
        
        if (!name || isNaN(lat) || isNaN(lng)) continue; // Skip invalid entries
        
        // EXCLUDE NON-BOOKING BUSINESSES
        const nameLower = name.toLowerCase();
        const addressLower = (address || '').toLowerCase();
        const combinedLower = `${nameLower} ${addressLower}`;
        
        // Exclude konbini/convenience stores
        if (combinedLower.match(/コンビニ|コンビニエンスストア|konbini|convenience store|convenience/i)) {
          continue;
        }
        
        // Exclude supermarkets (but allow スーパー銭湯 - super sento)
        if (combinedLower.match(/スーパーマーケット|スーパーストア|supermarket|grocery store|grocery/i) && 
            !combinedLower.match(/スーパー銭湯|super.*sento|super.*sentō/i)) {
          continue;
        }
        
        // Exclude retail stores
        if (combinedLower.match(/\b(shop|store|retail|小売|販売店|雑貨店|ドラッグストア|drugstore|pharmacy|薬局)\b/i) &&
            !combinedLower.match(/(beauty|salon|hairdresser|nail|ネイル|美容|ヘア|サロン)/i)) {
          continue;
        }
        
        // Exclude fast food and walk-in restaurants
        if (combinedLower.match(/fast food|takeout|take.out|drive.through|drive.thru|ファストフード|テイクアウト|食堂|shokudo|ラーメン|ramen|うどん|udon|そば|soba|立ち食い|立ち飲み/i)) {
          continue;
        }
        
        // Exclude hospitals (emergency care, no booking)
        if (combinedLower.match(/\b(hospital|病院|総合病院|大学病院)\b/i)) {
          continue;
        }
        
        // Exclude gyms and fitness centers (typically no booking)
        if (combinedLower.match(/\b(gym|fitness|ジム|フィットネス|スポーツクラブ|sports club|fitness centre|fitness center)\b/i)) {
          continue;
        }
        
        // Exclude public pools and water parks (typically no booking)
        if (combinedLower.match(/\b(swimming pool|プール|水泳場|water park|ウォーターパーク)\b/i)) {
          continue;
        }
        
        // Exclude camping sites (typically no booking)
        if (combinedLower.match(/\b(camp site|campsite|camping|キャンプ場|キャンピング)\b/i)) {
          continue;
        }
        
        // Exclude tourism apartments (typically no booking)
        if (combinedLower.match(/\b(tourism apartment|apartment|アパート|マンション|rental apartment)\b/i)) {
          continue;
        }
        
        const shop = {
          name: name,
          address: address,
          latitude: lat,
          longitude: lng,
          city: place.address?.city || place.address?.town || place.address?.village || place.tags?.['addr:city'] || place.tags?.['addr:town'] || null,
          country: place.address?.country || place.tags?.['addr:country'] || "Japan",
          zip_code: place.address?.postcode || place.tags?.['addr:postcode'] || null,
          phone: null,
          email: "",
          website: null,
          osm_id: osmId,
          osm_type: place.osm_type || place.type || 'node',
          category: categorizeShop(name, address),
        };
        
        allShops.set(osmId, shop);
      }
      
      // Mark as processed after successful search
      processedSearches.add(checkpointKey);
      saveCheckpoint(processedSearches);
      
      // Rate limit: 2 seconds between requests (more conservative to avoid 503 errors)
      await sleep(2000);
    }
    
      console.log(`  ✓ Found ${allShops.size} unique shops so far (${stats.skipped} searches skipped)`);
    }
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 Phase 1 Complete: Found ${allShops.size} unique shops`);
    console.log(`📍 Searched ${allLocations.length} locations across Japan`);
    console.log("=".repeat(60));
    
    // Save dataset to local file after fetching
    saveLocalDataset(allShops);
  }
  
  // Ensure allShops is not null before proceeding
  if (!allShops) {
    console.error("❌ Error: Failed to load shops dataset");
    return;
  }
  
  // Phase 2: Check duplicates and insert
  console.log("\n💾 Phase 2: Checking duplicates and inserting shops...\n");
  
  const shopsToInsert: any[] = [];
  const categoryIds: Record<string, string> = {};
  
  // Get all category IDs and create missing categories dynamically
  const { data: categories } = await supabase.from("categories").select("id, name");
  if (categories) {
    for (const cat of categories) {
      categoryIds[cat.name] = cat.id;
    }
  }
  
  // Function to get or create category by name
  const getOrCreateCategoryId = async (categoryName: string): Promise<string | null> => {
    // Check if category already exists
    if (categoryIds[categoryName]) {
      return categoryIds[categoryName];
    }
    
    // Create missing category
    const { data: newCategory, error } = await supabase
      .from("categories")
      .insert([{ name: categoryName, description: `Auto-created during shop import` }])
      .select("id")
      .single();
    
    if (error) {
      // If insert fails (e.g., duplicate), fetch existing category
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("name", categoryName)
        .single();
      
      if (existing) {
        categoryIds[categoryName] = existing.id;
        return existing.id;
      }
      
      console.warn(`⚠️  Could not create category "${categoryName}":`, error.message);
      return categoryIds["Unknown"] || null;
    }
    
    if (newCategory) {
      categoryIds[categoryName] = newCategory.id;
      console.log(`  ✓ Created new category: "${categoryName}"`);
      return newCategory.id;
    }
    
    return categoryIds["Unknown"] || null;
  };
  
  let processed = 0;
  for (const [osmId, shop] of allShops.entries()) {
    processed++;
    if (processed % 100 === 0) {
      console.log(`  ⏳ Processed ${processed}/${allShops.size} shops...`);
    }
    
    const duplicateCheck = await isDuplicate(shop);
    if (duplicateCheck.isDuplicate) {
      stats.duplicates++;
      continue;
    }
    
    // Skip shops with "Unknown" category (includes non-booking businesses)
    if (shop.category === "Unknown") {
      continue;
    }
    
    // Get or create category ID dynamically
    const categoryId = await getOrCreateCategoryId(shop.category);
    if (!categoryId) {
      console.warn(`⚠️  Skipping shop "${shop.name}" - could not resolve category "${shop.category}"`);
      continue;
    }
    
    shopsToInsert.push({
      name: shop.name,
      address: shop.address,
      latitude: shop.latitude,
      longitude: shop.longitude,
      city: shop.city,
      country: shop.country,
      zip_code: shop.zip_code,
      phone: shop.phone,
      email: shop.email,
      website: shop.website,
      category_id: categoryId,
      claim_status: "unclaimed",
      osm_id: shop.osm_id,
    });
    
    // Track by category
    stats.byCategory[shop.category] = (stats.byCategory[shop.category] || 0) + 1;
  }
  
  console.log(`\n  ✓ ${shopsToInsert.length} shops ready to insert (${stats.duplicates} duplicates skipped)`);
  
  // Phase 3: Batch insert
  console.log("\n📦 Phase 3: Inserting shops in batches...\n");
  
  const batchSize = 100;
  for (let i = 0; i < shopsToInsert.length; i += batchSize) {
    const batch = shopsToInsert.slice(i, i + batchSize);
    const { error } = await supabase.from("shops").insert(batch);
    
    if (error) {
      console.error(`  ❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      stats.errors += batch.length;
    } else {
      stats.inserted += batch.length;
      console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${batch.length} shops`);
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 IMPORT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total shops found: ${stats.totalFound}`);
  console.log(`Unique shops: ${allShops.size}`);
  console.log(`Searches skipped (already processed): ${stats.skipped}`);
  console.log(`Duplicates skipped: ${stats.duplicates}`);
  console.log(`Successfully inserted: ${stats.inserted}`);
  console.log(`Errors: ${stats.errors}`);
  
  // Clean up checkpoint file on successful completion
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
    console.log(`\n🧹 Checkpoint file cleaned up`);
  }
  console.log("\nBy Category:");
  for (const [category, count] of Object.entries(stats.byCategory)) {
    console.log(`  ${category}: ${count}`);
  }
  console.log("\n✅ Import complete!");
}

// Run
importJapanShops()
  .then(() => {
    console.log("\n🎉 Script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });


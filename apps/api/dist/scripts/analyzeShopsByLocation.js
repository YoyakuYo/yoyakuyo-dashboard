"use strict";
// apps/api/src/scripts/analyzeShopsByLocation.ts
// Analyzes how many shops exist in the database for each location from the import script
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env") });
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
    process.exit(1);
}
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Same locations as in importJapanShopsOSM.ts
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
// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}
// Count shops within radius of a location
function countShopsInLocation(location_1) {
    return __awaiter(this, arguments, void 0, function* (location, radiusKm = 5) {
        // Use a bounding box approach for efficiency (approximately radiusKm km)
        // 1 degree latitude ≈ 111 km, so radiusKm km ≈ radiusKm/111 degrees
        const radiusDegrees = radiusKm / 111;
        const { data, error } = yield supabase
            .from("shops")
            .select("id, latitude, longitude", { count: 'exact' })
            .gte("latitude", location.lat - radiusDegrees)
            .lte("latitude", location.lat + radiusDegrees)
            .gte("longitude", location.lng - radiusDegrees)
            .lte("longitude", location.lng + radiusDegrees);
        if (error) {
            console.error(`Error counting shops for ${location.name}:`, error);
            return 0;
        }
        if (!data)
            return 0;
        // Filter by actual distance (more accurate than bounding box)
        const shopsInRadius = data.filter(shop => {
            if (!shop.latitude || !shop.longitude)
                return false;
            const distance = calculateDistance(location.lat, location.lng, shop.latitude, shop.longitude);
            return distance <= radiusKm;
        });
        return shopsInRadius.length;
    });
}
// Main analysis function
function analyzeShopsByLocation() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🔍 Analyzing shops by location...\n");
        console.log(`📍 Checking ${JAPAN_LOCATIONS.length} locations\n`);
        console.log("=".repeat(80));
        const results = [];
        let totalShops = 0;
        const radiusKm = 5; // 5km radius around each location
        for (let i = 0; i < JAPAN_LOCATIONS.length; i++) {
            const location = JAPAN_LOCATIONS[i];
            process.stdout.write(`\r📍 [${i + 1}/${JAPAN_LOCATIONS.length}] Checking: ${location.name.padEnd(40)}`);
            const count = yield countShopsInLocation(location, radiusKm);
            results.push({ location: location.name, count, index: i + 1 });
            totalShops += count;
            // Small delay to avoid overwhelming the database
            yield new Promise(resolve => setTimeout(resolve, 50));
        }
        console.log("\n" + "=".repeat(80));
        console.log("\n📊 RESULTS BY LOCATION\n");
        console.log("=".repeat(80));
        // Sort by count (descending)
        results.sort((a, b) => b.count - a.count);
        // Group by city
        const tokyoResults = results.filter(r => r.location.startsWith("Tokyo"));
        const osakaResults = results.filter(r => r.location.startsWith("Osaka"));
        const kyotoResults = results.filter(r => r.location.startsWith("Kyoto"));
        console.log("\n🏙️  TOKYO AREAS:");
        console.log("-".repeat(80));
        tokyoResults.forEach(r => {
            console.log(`  ${r.index.toString().padStart(3)}. ${r.location.padEnd(45)} ${r.count.toString().padStart(5)} shops`);
        });
        console.log("\n🏙️  OSAKA AREAS:");
        console.log("-".repeat(80));
        osakaResults.forEach(r => {
            console.log(`  ${r.index.toString().padStart(3)}. ${r.location.padEnd(45)} ${r.count.toString().padStart(5)} shops`);
        });
        console.log("\n🏙️  KYOTO AREAS:");
        console.log("-".repeat(80));
        kyotoResults.forEach(r => {
            console.log(`  ${r.index.toString().padStart(3)}. ${r.location.padEnd(45)} ${r.count.toString().padStart(5)} shops`);
        });
        console.log("\n" + "=".repeat(80));
        console.log("\n📈 SUMMARY");
        console.log("=".repeat(80));
        console.log(`Total locations checked: ${JAPAN_LOCATIONS.length}`);
        console.log(`Total shops found (with overlap): ${totalShops}`);
        console.log(`\nTop 10 locations by shop count:`);
        results.slice(0, 10).forEach((r, idx) => {
            console.log(`  ${idx + 1}. ${r.location.padEnd(45)} ${r.count.toString().padStart(5)} shops`);
        });
        console.log(`\nLocations with 0 shops:`);
        const zeroShops = results.filter(r => r.count === 0);
        if (zeroShops.length > 0) {
            zeroShops.forEach(r => {
                console.log(`  - ${r.location} (index ${r.index})`);
            });
        }
        else {
            console.log(`  None! All locations have at least one shop.`);
        }
        // Get unique shop count (without overlap)
        console.log(`\n📊 Getting unique shop count...`);
        const { count: uniqueCount } = yield supabase
            .from("shops")
            .select("*", { count: 'exact', head: true });
        console.log(`\nUnique shops in database: ${uniqueCount || 0}`);
        console.log("\n✅ Analysis complete!");
    });
}
// Run
analyzeShopsByLocation()
    .then(() => {
    console.log("\n🎉 Script finished successfully");
    process.exit(0);
})
    .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
});

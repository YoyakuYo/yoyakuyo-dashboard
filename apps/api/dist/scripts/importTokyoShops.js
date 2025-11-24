"use strict";
// apps/api/src/scripts/importTokyoShops.ts
// Tokyo Business Importer using Google Places API
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
// Validate required environment variables
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!GOOGLE_MAPS_API_KEY) {
    console.error("❌ Error: GOOGLE_MAPS_API_KEY is missing from .env");
    process.exit(1);
}
if (!SUPABASE_URL) {
    console.error("❌ Error: SUPABASE_URL is missing from .env");
    process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY is missing from .env");
    process.exit(1);
}
// Initialize Supabase client with service role key for admin operations
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Tokyo area coordinates (latitude, longitude)
const TOKYO_LOCATIONS = [
    { name: "Shinjuku", lat: 35.6938, lng: 139.7034 },
    { name: "Shibuya", lat: 35.6598, lng: 139.7006 },
    { name: "Ikebukuro", lat: 35.7295, lng: 139.7109 },
    { name: "Ueno", lat: 35.7138, lng: 139.7773 },
    { name: "Ginza", lat: 35.6719, lng: 139.7659 },
    { name: "Roppongi", lat: 35.6627, lng: 139.7314 },
    { name: "Akihabara", lat: 35.6984, lng: 139.7731 },
    { name: "Tokyo Station", lat: 35.6812, lng: 139.7671 },
];
// Search keywords for different business types
const SEARCH_KEYWORDS = [
    "barber shop",
    "barbershop",
    "hair salon",
    "haircut",
    "beauty salon",
    "beauty salon tokyo",
    "nail salon",
    "nails",
    "eyelash salon",
    "lash lift",
    "eyelash extensions",
    "spa",
    "day spa",
    "massage",
    "massage therapy",
];
// Place types to search for
const PLACE_TYPES = ["beauty_salon", "hair_care", "spa", "point_of_interest", "establishment"];
const stats = {
    totalFetched: 0,
    inserted: 0,
    skipped: 0,
    errors: 0,
};
// Sleep function to respect API rate limits
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
// Fetch places using Google Places Nearby Search API
function fetchNearbyPlaces(location_1, keyword_1) {
    return __awaiter(this, arguments, void 0, function* (location, keyword, radius = 2000, pageToken) {
        const baseUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
        const params = new URLSearchParams({
            location: `${location.lat},${location.lng}`,
            radius: radius.toString(),
            keyword: keyword,
            key: GOOGLE_MAPS_API_KEY,
            language: "en",
        });
        // Note: When using keyword, type is optional. Keywords are more flexible.
        // We can add type filtering if needed, but keywords alone work well.
        if (pageToken) {
            params.append("pagetoken", pageToken);
        }
        try {
            const response = yield fetch(`${baseUrl}?${params.toString()}`);
            const data = (yield response.json());
            if (data.status === "OK") {
                return {
                    results: data.results || [],
                    nextPageToken: data.next_page_token,
                };
            }
            else if (data.status === "ZERO_RESULTS") {
                return { results: [] };
            }
            else if (data.status === "INVALID_REQUEST") {
                console.error("Google Places API error:", data);
                console.warn(`⚠️  Invalid request for keyword "${keyword}" at ${location.lat},${location.lng}: ${data.error_message || data.status}`);
                return { results: [] };
            }
            else {
                console.error("Google Places API error:", data);
                console.warn(`⚠️  API error for keyword "${keyword}": ${data.status} - ${data.error_message || ""}`);
                return { results: [] };
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Error fetching places for "${keyword}":`, errorMessage);
            return { results: [] };
        }
    });
}
// Fetch place details using Google Places Place Details API
function fetchPlaceDetails(placeId) {
    return __awaiter(this, void 0, void 0, function* () {
        const baseUrl = "https://maps.googleapis.com/maps/api/place/details/json";
        const params = new URLSearchParams({
            place_id: placeId,
            fields: "name,formatted_address,formatted_phone_number,website,geometry,opening_hours,business_status",
            key: GOOGLE_MAPS_API_KEY,
            language: "en",
        });
        try {
            const response = yield fetch(`${baseUrl}?${params.toString()}`);
            const details = (yield response.json());
            if (details.status === "OK" && details.result) {
                return details.result;
            }
            else {
                console.error("Google Places API error:", details);
                console.warn(`⚠️  Place details error for ${placeId}: ${details.status} - ${details.error_message || ""}`);
                return null;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Error fetching place details for ${placeId}:`, errorMessage);
            return null;
        }
    });
}
// Convert place details to shop record
function placeToShopRecord(placeDetails) {
    return {
        name: placeDetails.name || "",
        address: placeDetails.formatted_address || null,
        phone: placeDetails.formatted_phone_number || null,
        email: "", // Empty string as Google Places rarely provides email
    };
}
// Split array into chunks of specified size
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}
// Insert shops in batches
function insertShopsBatch(shops) {
    return __awaiter(this, void 0, void 0, function* () {
        const chunks = chunkArray(shops, 100);
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`  📦 Inserting batch ${i + 1}/${chunks.length} (${chunk.length} shops)...`);
            const { error } = yield supabase.from("shops").insert(chunk);
            if (error) {
                console.error(`❌ Error inserting batch ${i + 1}:`, error);
                throw new Error(`Failed to insert batch ${i + 1}: ${error.message}`);
            }
            stats.inserted += chunk.length;
            console.log(`  ✓ Batch ${i + 1} inserted successfully`);
        }
    });
}
// Main import function
function importTokyoShops() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🚀 Starting Tokyo Business Importer...\n");
        console.log(`📍 Searching ${TOKYO_LOCATIONS.length} locations`);
        console.log(`🔍 Using ${SEARCH_KEYWORDS.length} keywords\n`);
        const allPlaceIds = new Set(); // Track unique place IDs to avoid duplicates
        const placeDetailsMap = new Map(); // Store place details by place_id
        // Phase 1: Fetch all places from Google Places API
        console.log("📡 Phase 1: Fetching places from Google Places API...\n");
        for (const location of TOKYO_LOCATIONS) {
            console.log(`📍 Processing: ${location.name} (${location.lat}, ${location.lng})`);
            console.log("─".repeat(50));
            for (const keyword of SEARCH_KEYWORDS) {
                console.log(`  🔍 Searching: "${keyword}"...`);
                let nextPageToken;
                let pageCount = 0;
                do {
                    // Fetch places with pagination
                    const { results, nextPageToken: token } = yield fetchNearbyPlaces(location, keyword, 2000, nextPageToken);
                    pageCount++;
                    console.log(`    Page ${pageCount}: Found ${results.length} places`);
                    // Process each place
                    for (const place of results) {
                        const placeId = place.place_id;
                        // Skip if we've already processed this place
                        if (allPlaceIds.has(placeId)) {
                            stats.skipped++;
                            continue;
                        }
                        allPlaceIds.add(placeId);
                        stats.totalFetched++;
                        // Fetch detailed information
                        yield sleep(100); // Rate limiting: 100ms between requests
                        const placeDetails = yield fetchPlaceDetails(placeId);
                        if (placeDetails) {
                            placeDetailsMap.set(placeId, placeDetails);
                        }
                        else {
                            stats.errors++;
                        }
                        // Small delay between requests
                        yield sleep(50);
                    }
                    nextPageToken = token;
                    // Wait before fetching next page (Google requires delay for next_page_token)
                    if (nextPageToken) {
                        console.log(`    ⏳ Waiting 2 seconds before fetching next page...`);
                        yield sleep(2000);
                    }
                } while (nextPageToken);
                // Delay between keywords to respect rate limits
                yield sleep(200);
            }
            // Delay between locations
            yield sleep(500);
        }
        // Phase 2: Convert place details to shop records and insert into database
        console.log("\n" + "=".repeat(60));
        console.log("💾 Phase 2: Inserting shops into database...");
        console.log("=".repeat(60));
        const shopRecords = [];
        for (const [placeId, placeDetails] of placeDetailsMap.entries()) {
            try {
                const shopRecord = placeToShopRecord(placeDetails);
                shopRecords.push(shopRecord);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`❌ Error converting place ${placeId} to shop record:`, errorMessage);
                stats.errors++;
            }
        }
        console.log(`\n📊 Prepared ${shopRecords.length} shop records for insertion`);
        if (shopRecords.length === 0) {
            console.log("⚠️  No shop records to insert. Exiting.");
            return;
        }
        try {
            yield insertShopsBatch(shopRecords);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("\n❌ Fatal error during batch insertion:", errorMessage);
            throw error;
        }
        // Print summary
        console.log("\n" + "=".repeat(60));
        console.log("📊 IMPORT SUMMARY");
        console.log("=".repeat(60));
        console.log(`Total places fetched: ${stats.totalFetched}`);
        console.log(`Total records inserted into shops: ${stats.inserted}`);
        console.log(`Total skipped (duplicates): ${stats.skipped}`);
        console.log(`Total errors: ${stats.errors}`);
        console.log("\n✅ Import complete!");
    });
}
// Run the importer
importTokyoShops()
    .then(() => {
    console.log("\n🎉 Script finished successfully");
    process.exit(0);
})
    .catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n❌ Fatal error:", errorMessage);
    process.exit(1);
});

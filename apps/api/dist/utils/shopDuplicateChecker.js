"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkShopDuplicate = checkShopDuplicate;
/**
 * Check if a shop already exists in the database
 * Uses multiple strategies: name+address similarity, coordinates proximity, OSM ID
 */
function checkShopDuplicate(client, shop) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // Strategy 1: Check by OSM ID if available
        if (shop.osm_id) {
            const { data: osmMatch } = yield client
                .from("shops")
                .select("id, name, address, latitude, longitude")
                .eq("osm_id", shop.osm_id.toString())
                .maybeSingle();
            if (osmMatch) {
                return {
                    isDuplicate: true,
                    existingShop: osmMatch,
                    reason: "OSM ID match",
                };
            }
        }
        // Strategy 2: Check by coordinates (within 50 meters)
        if (shop.latitude && shop.longitude) {
            // Calculate approximate bounding box (50m radius ≈ 0.00045 degrees)
            const radius = 0.00045;
            const { data: coordMatches } = yield client
                .from("shops")
                .select("id, name, address, latitude, longitude")
                .gte("latitude", shop.latitude - radius)
                .lte("latitude", shop.latitude + radius)
                .gte("longitude", shop.longitude - radius)
                .lte("longitude", shop.longitude + radius)
                .limit(10);
            if (coordMatches && coordMatches.length > 0) {
                // Check exact coordinate match (within 10 meters)
                const exactMatch = coordMatches.find((existing) => {
                    if (!existing.latitude || !existing.longitude)
                        return false;
                    const latDiff = Math.abs(existing.latitude - shop.latitude);
                    const lngDiff = Math.abs(existing.longitude - shop.longitude);
                    return latDiff < 0.0001 && lngDiff < 0.0001; // ~10 meters
                });
                if (exactMatch) {
                    return {
                        isDuplicate: true,
                        existingShop: exactMatch,
                        reason: "Coordinates match (within 10m)",
                    };
                }
            }
        }
        // Strategy 3: Check by name + address similarity
        const nameNormalized = shop.name.toLowerCase().trim();
        const addressNormalized = shop.address.toLowerCase().trim();
        // Get shops with similar names
        const { data: nameMatches } = yield client
            .from("shops")
            .select("id, name, address, latitude, longitude")
            .ilike("name", `%${nameNormalized}%`)
            .limit(20);
        if (nameMatches && nameMatches.length > 0) {
            // Check for exact name match
            const exactNameMatch = nameMatches.find((s) => s.name.toLowerCase().trim() === nameNormalized);
            if (exactNameMatch) {
                // Check if address is similar (at least 50% match)
                const existingAddress = ((_a = exactNameMatch.address) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) || "";
                const similarity = calculateSimilarity(addressNormalized, existingAddress);
                if (similarity > 0.5) {
                    return {
                        isDuplicate: true,
                        existingShop: exactNameMatch,
                        reason: `Name match + address similarity (${Math.round(similarity * 100)}%)`,
                    };
                }
            }
        }
        return { isDuplicate: false };
    });
}
/**
 * Calculate string similarity using word overlap
 */
function calculateSimilarity(str1, str2) {
    if (str1 === str2)
        return 1;
    if (str1.length === 0 || str2.length === 0)
        return 0;
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    // Check if one string contains the other
    if (longer.includes(shorter)) {
        return shorter.length / longer.length;
    }
    // Simple word overlap check
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const commonWords = words1.filter((w) => words2.includes(w));
    return commonWords.length / Math.max(words1.length, words2.length);
}

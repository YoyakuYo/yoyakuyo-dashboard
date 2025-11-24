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
exports.assignCategory = assignCategory;
exports.getCategoryId = getCategoryId;
/**
 * Auto-assign category based on shop name and address patterns
 * Returns category name (not ID) - caller should resolve to ID
 */
function assignCategory(shop) {
    const nameLower = shop.name.toLowerCase();
    const addressLower = (shop.address || "").toLowerCase();
    const combined = `${nameLower} ${addressLower}`;
    // Define patterns for each category (order matters - most specific first)
    const categoryPatterns = {
        "Eyelash": [
            "eyelash", "lash", "extension", "まつげ", "エクステ", "ラッシュ"
        ],
        "Nail Salon": [
            "nail salon", "nails", "nail", "manicure", "pedicure",
            "ネイル", "マニキュア", "ネイルサロン", "ネイルアート"
        ],
        "Barbershop": [
            "barber", "barbershop", "men's", "mens", "理髪", "理容", "理髪店", "理容室"
        ],
        "Dental Clinic": [
            "dental", "dentist", "歯科", "デンタル", "歯医者", "歯科医院", "歯科クリニック"
        ],
        "Women's Clinic": [
            "gynecology", "gynecologist", "women's clinic", "womens clinic",
            "婦人科", "女性クリニック", "産婦人科", "レディースクリニック", "女性診療"
        ],
        "Spa & Massage": [
            "spa", "massage", "therapy", "relaxation", "スパ", "マッサージ", "エステ"
        ],
        "Hair Salon": [
            "hair salon", "haircut", "hair color", "haircolor", "ヘアサロン", "美容室"
        ],
        "Beauty Salon": [
            "beauty", "cosmetic", "makeup", "make-up", "美容", "コスメ"
        ],
    };
    // Check patterns in order (most specific first)
    for (const [categoryName, patterns] of Object.entries(categoryPatterns)) {
        for (const pattern of patterns) {
            if (combined.includes(pattern)) {
                return categoryName;
            }
        }
    }
    // Default to "Unknown" category
    return "Unknown";
}
/**
 * Get category ID from category name
 */
function getCategoryId(client, categoryName) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data } = yield client
            .from("categories")
            .select("id")
            .eq("name", categoryName)
            .single();
        return (data === null || data === void 0 ? void 0 : data.id) || null;
    });
}

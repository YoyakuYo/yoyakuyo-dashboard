import { SupabaseClient } from "@supabase/supabase-js";

interface ShopData {
  name: string;
  address?: string;
}

/**
 * Auto-assign category based on shop name and address patterns
 * Returns category name (not ID) - caller should resolve to ID
 */
export function assignCategory(shop: ShopData): string {
  const nameLower = shop.name.toLowerCase();
  const addressLower = (shop.address || "").toLowerCase();
  const combined = `${nameLower} ${addressLower}`;

  // Define patterns for each category (order matters - most specific first)
  const categoryPatterns: Record<string, string[]> = {
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
export async function getCategoryId(
  client: SupabaseClient,
  categoryName: string
): Promise<string | null> {
  const { data } = await client
    .from("categories")
    .select("id")
    .eq("name", categoryName)
    .single();
  
  return data?.id || null;
}


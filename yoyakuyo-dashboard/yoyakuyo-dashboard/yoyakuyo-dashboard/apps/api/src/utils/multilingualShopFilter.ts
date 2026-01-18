// apps/api/src/utils/multilingualShopFilter.ts
// Deterministic multilingual "filter AI" utilities (NO LLM guessing).

export type CanonicalService = "nails" | "hair" | "restaurant" | "spa" | "clinic" | "hotel" | "golf" | "karaoke";

export const services_map: Record<CanonicalService, string[]> = {
  nails: ["nail", "nails", "ongle", "ongles", "uña", "uñas", "unha", "unhas", "ネイル", "美甲", "네일"],
  hair: ["hair", "haircut", "barber", "barbershop", "coiffure", "pelo", "cabello", "cabelo", "美容室", "理容", "床屋", "头发", "헤어"],
  restaurant: ["restaurant", "food", "restaurante", "restaurante", "レストラン", "餐厅", "식당", "居酒屋", "izakaya"],
  spa: ["spa", "massage", "massages", "masaje", "masajes", "massagem", "massagens", "スパ", "マッサージ", "按摩", "마사지", "温泉", "onsen"],
  clinic: ["clinic", "dentist", "dental", "medical", "clinica", "clínica", "clinique", "クリニック", "歯科", "医院", "诊所", "병원"],
  hotel: ["hotel", "ryokan", "旅館", "ホテル", "住宿", "宿泊", "숙소"],
  golf: ["golf", "ゴルフ", "골프"],
  karaoke: ["karaoke", "カラオケ", "노래방"],
};

const NON_LATIN_REGEX = /[\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/;
const NON_ASCII_REGEX = /[^\x00-\x7F]/;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function detectService(text: string): { service: CanonicalService; matched: string } | null {
  const raw = (text || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  const entries = Object.entries(services_map) as Array<[CanonicalService, string[]]>;
  for (const [service, variants] of entries) {
    const sorted = [...variants].sort((a, b) => b.length - a.length);
    for (const v of sorted) {
      if (!v) continue;
      if (NON_ASCII_REGEX.test(v) || NON_LATIN_REGEX.test(v)) {
        if (raw.includes(v)) return { service, matched: v };
        continue;
      }
      const re = new RegExp(`\\b${escapeRegex(v.toLowerCase())}\\b`, "i");
      if (re.test(lower)) return { service, matched: v };
    }
  }
  return null;
}

export type JapanLocationDetection = { canonical: string; variants: string[] };

const JP_LOCATIONS: JapanLocationDetection[] = [
  { canonical: "shibuya", variants: ["渋谷", "shibuya"] },
  { canonical: "shinjuku", variants: ["新宿", "shinjuku"] },
  { canonical: "tokyo", variants: ["東京", "東京都", "tokyo"] },
  { canonical: "osaka", variants: ["大阪", "大阪府", "osaka"] },
  { canonical: "sapporo", variants: ["札幌", "sapporo"] },
  { canonical: "yokohama", variants: ["横浜", "yokohama"] },
  { canonical: "nagoya", variants: ["名古屋", "nagoya"] },
  { canonical: "fukuoka", variants: ["福岡", "fukuoka"] },
  { canonical: "kyoto", variants: ["京都", "kyoto"] },
];

export function detectJapanLocation(text: string): JapanLocationDetection | null {
  const raw = (text || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  const flattened = JP_LOCATIONS.flatMap((l) =>
    l.variants.map((v) => ({ loc: l, v, len: v.length, isNonLatin: NON_ASCII_REGEX.test(v) || NON_LATIN_REGEX.test(v) }))
  ).sort((a, b) => b.len - a.len);

  for (const item of flattened) {
    if (item.isNonLatin) {
      if (raw.includes(item.v)) return item.loc;
    } else {
      const re = new RegExp(`\\b${escapeRegex(item.v.toLowerCase())}\\b`, "i");
      if (re.test(lower)) return item.loc;
    }
  }

  const kanjiToken = raw.match(/[\u3400-\u9FFF]{2,}(?:都|道|府|県|市|区)?/);
  if (kanjiToken?.[0]) return { canonical: kanjiToken[0], variants: [kanjiToken[0]] };

  return null;
}

export function formatShopLinks(shops: Array<{ id: string; name: string; address?: string | null }>): string {
  return shops.map((s) => `- [${s.name}](/shops/${s.id})${s.address ? ` — ${s.address}` : ""}`).join("\n");
}



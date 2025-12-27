// apps/api/src/ai/ai.ts
// SINGLE AI MODE: SHOP_DISCOVERY_ONLY
// - Stateless: each message processed independently (NO memory, NO DB writes)
// - Intents: GREETING | SERVICE DETECTION | LOCATION DETECTION -> SHOP SUGGESTION
// - Read-only: shops + services/categories (NO booking, NO identity, NO conversation state)

import type { SupabaseClient } from "@supabase/supabase-js";

export type ShopDiscoveryIntent = "GREETING" | "SERVICE" | "LOCATION" | "UNKNOWN";

export type ShopCard = {
  shop_id: string;
  shop_name: string;
  area: string;
  cta: "View shop";
};

export type ShopDiscoveryResult = {
  mode: "SHOP_DISCOVERY_ONLY";
  intent: ShopDiscoveryIntent;
  response: string;
  shop_cards: ShopCard[] | null;
};

function norm(s: string): string {
  return String(s || "").trim().toLowerCase();
}

function isGreeting(message: string): boolean {
  const t = String(message || "").trim();
  return /^(hi|hello|hey|good morning|good afternoon|good evening|こんにちは|こんばんは|おはよう|やあ)[!！。.\s]*$/i.test(t);
}

const SERVICE_KEYWORDS: Array<{ key: string; keywords: string[]; categoryNames: string[] }> = [
  {
    key: "HAIR_CUT",
    keywords: ["haircut", "hair cut", "hair", "barber", "サロン", "美容室", "理容", "床屋", "カット", "corte", "corte de cabelo", "pelo", "cabello", "cabelo", "剪发", "理发", "헤어", "헤어컷"],
    categoryNames: ["Hair Salon", "Barber Shop", "Barbershop"],
  },
  {
    key: "NAIL",
    keywords: ["nail", "nails", "uña", "uñas", "unha", "unhas", "ネイル", "美甲", "네일"],
    categoryNames: ["Nail Salon"],
  },
  {
    key: "RESTAURANT",
    keywords: ["restaurant", "food", "restaurante", "レストラン", "餐厅", "식당", "izakaya", "居酒屋"],
    categoryNames: ["Restaurant", "Izakaya", "Izakaya & Bar", "Cafe", "Bar"],
  },
  {
    key: "MASSAGE",
    keywords: ["massage", "massages", "masaje", "massagem", "マッサージ", "スパ", "按摩", "마사지"],
    categoryNames: ["Spa, Onsen & Relaxation", "Spa & Massage", "Relaxation", "Onsen", "Ryokan", "Onsen & Ryokan"],
  },
];

function detectService(message: string): { key: string; categoryNames: string[] } | null {
  const t = norm(message);
  for (const s of SERVICE_KEYWORDS) {
    if (s.keywords.some((k) => t.includes(norm(k)))) return { key: s.key, categoryNames: s.categoryNames };
  }
  return null;
}

const LOCATION_KEYWORDS: string[] = [
  "chofu",
  "調布",
  "shibuya",
  "渋谷",
  "渋谷区",
  "shibuya-ku",
  "shinjuku",
  "新宿",
  "新宿区",
  "shinjuku-ku",
  "tokyo",
  "東京",
  "東京都",
  "東京to",
  "osaka",
  "大阪",
  "大阪府",
];

function detectLocation(message: string): string | null {
  const raw = String(message || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  for (const k of LOCATION_KEYWORDS) {
    if (lower.includes(k.toLowerCase()) || raw.includes(k)) return k;
  }
  return null;
}

async function categoryIdsForService(supabase: SupabaseClient, categoryNames: string[]): Promise<string[]> {
  if (!categoryNames.length) return [];
  const { data, error } = await supabase.from("categories").select("id,name").in("name", categoryNames);
  if (error) throw error;
  return (data || []).map((c: any) => String(c.id));
}

function areaFromShopRow(shop: any): string {
  const p = (shop?.prefecture as string | undefined) || "";
  const c = (shop?.city as string | undefined) || (shop?.normalized_city as string | undefined) || "";
  const area = `${p} ${c}`.trim();
  if (area) return area;
  const addr = (shop?.address as string | undefined) || "";
  return addr ? addr.slice(0, 24) : "Japan";
}

async function searchVerifiedShops(params: { supabase: SupabaseClient; categoryIds: string[]; location: string }): Promise<ShopCard[]> {
  let q: any = params.supabase
    .from("shops")
    .select("id,name,address,prefecture,city,normalized_city,is_verified,category_id")
    .eq("is_verified", true)
    .ilike("address", `%${params.location}%`)
    .order("name", { ascending: true })
    .limit(30);

  if (params.categoryIds.length > 0) q = q.in("category_id", params.categoryIds);

  const { data, error } = await q;
  if (error) throw error;

  return (data || []).map((s: any) => ({
    shop_id: String(s.id),
    shop_name: String(s.name),
    area: areaFromShopRow(s),
    cta: "View shop",
  }));
}

export async function handleShopDiscoveryOnly(message: string, supabase: SupabaseClient): Promise<ShopDiscoveryResult> {
  if (isGreeting(message)) {
    return {
      mode: "SHOP_DISCOVERY_ONLY",
      intent: "GREETING",
      response: "Welcome to YoYakuYo 👋 What are you looking to book today?",
      shop_cards: null,
    };
  }

  const service = detectService(message);
  const location = detectLocation(message);

  if (service && !location) {
    return {
      mode: "SHOP_DISCOVERY_ONLY",
      intent: "SERVICE",
      response: "Got it. Which area or prefecture are you looking in?",
      shop_cards: null,
    };
  }

  if (service && location) {
    const categoryIds = await categoryIdsForService(supabase, service.categoryNames);
    const shops = await searchVerifiedShops({ supabase, categoryIds, location });
    return {
      mode: "SHOP_DISCOVERY_ONLY",
      intent: "LOCATION",
      response: "Available verified shops",
      shop_cards: shops,
    };
  }

  return {
    mode: "SHOP_DISCOVERY_ONLY",
    intent: location ? "LOCATION" : "UNKNOWN",
    response: "Can you tell me what service you’re looking for and the area?",
    shop_cards: null,
  };
}



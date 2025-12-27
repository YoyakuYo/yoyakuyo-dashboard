// apps/api/src/ai/ai.ts
// Root AI entry: deterministic state machine (role -> greeting -> intent -> action).
// Used by /ai/chat before any other business logic.

import type { SupabaseClient } from "@supabase/supabase-js";
import { detectJapanLocation, detectService, formatShopLinks, type CanonicalService } from "../utils/multilingualShopFilter";

export type RootAiRole = "OWNER" | "LINE_CUSTOMER" | "WEB_CUSTOMER" | "GUEST";
export type RootAiIntent = "greeting_only" | "browse_shops" | "booking" | "help" | "unknown";

export function resolveRole(context: { ownerId?: string | null; lineUserId?: string | null; webUserId?: string | null }): RootAiRole {
  if (context.ownerId) return "OWNER";
  if (context.lineUserId) return "LINE_CUSTOMER";
  if (context.webUserId) return "WEB_CUSTOMER";
  return "GUEST";
}

export function detectIntent(message: string): RootAiIntent {
  const text = String(message || "").trim();
  if (!text) return "unknown";
  const lower = text.toLowerCase();

  const greetingOnly =
    /^(hi|hello|helo|hey|yo|hiya|how are you|how're you|good (morning|afternoon|evening)|what's up|sup)[!！。.\s]*$/i;
  const greetingIntl =
    /^(こんにちは|やあ|もしもし|おはよう|こんばんは|元気|調子どう)[!！。.\s]*$|^(안녕|안녕하세요|잘 지내|어떻게 지내)[!！。.\s]*$|^(你好|您好|嗨|早上好|晚上好)[!！。.\s]*$|^(hola|buenos dias|buenas tardes|buenas noches)[!！。.\s]*$|^(ol[aá]|bom dia|boa tarde|boa noite)[!！。.\s]*$/i;
  if (greetingOnly.test(text) || greetingIntl.test(text)) return "greeting_only";

  if (/\b(book|booking|reserve|reservation)\b/i.test(lower)) return "booking";
  if (/\b(find|search|browse|looking for|near me|nearby|shop|salon|barber|restaurant|spa|clinic|hotel)\b/i.test(lower)) return "browse_shops";
  if (/\b(help|support|how do i|what can you do)\b/i.test(lower)) return "help";
  return "unknown";
}

function greetingForRole(role: RootAiRole, customerName: string | null): string {
  if (role === "OWNER") return "Hello 👋 What would you like to manage today?";
  if (role === "WEB_CUSTOMER" || role === "LINE_CUSTOMER") {
    const name = customerName?.trim();
    return name
      ? `Hello ${name}, welcome back 👋\n\nWhat would you like to do today?`
      : "Hello, welcome back 👋\n\nWhat would you like to do today?";
  }
  return "Hello, welcome to YoyakuYo 👋\n\nHow can I help you today?";
}

async function queryVerifiedShops(params: {
  db: SupabaseClient;
  service: CanonicalService;
  locationVariants: string[];
}): Promise<Array<{ id: string; name: string; address: string | null }>> {
  const serviceToCategoryNames: Record<string, string[]> = {
    nails: ["Nail Salon"],
    hair: ["Hair Salon", "Barbershop", "Barber Shop"],
    restaurant: ["Restaurant", "Izakaya"],
    spa: ["Spa", "Massages", "Onsen", "Ryokan Onsen"],
    clinic: ["Dental Clinic", "Medical Clinic", "Aesthetic Clinic", "Women's Clinic"],
    hotel: ["Hotel", "Ryokan"],
    golf: ["Golf Courses & Practice Ranges"],
    karaoke: ["Private Karaoke Rooms"],
  };

  const categoryNames = serviceToCategoryNames[params.service] || [];
  let categoryIds: string[] = [];
  if (categoryNames.length > 0) {
    const { data: cats } = await params.db.from("categories").select("id").in("name", categoryNames);
    categoryIds = (cats || []).map((c: any) => String(c.id));
  }

  const locVariants = Array.from(new Set((params.locationVariants || []).map((v) => String(v).trim()).filter(Boolean)));
  const orParts: string[] = [];
  for (const v of locVariants) {
    const safe = v.replace(/,/g, " ");
    orParts.push(`prefecture.ilike.%${safe}%`);
    orParts.push(`city.ilike.%${safe}%`);
    orParts.push(`address.ilike.%${safe}%`);
  }

  let q: any = params.db
    .from("shops")
    .select("id,name,address,is_verified")
    .eq("is_verified", true)
    .order("name", { ascending: true })
    .limit(12);

  if (categoryIds.length > 0) q = q.in("category_id", categoryIds);
  if (orParts.length > 0) q = q.or(orParts.join(","));

  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((s: any) => ({ id: String(s.id), name: String(s.name), address: s.address ? String(s.address) : null }));
}

export async function runRootAiStateMachine(params: {
  message: string;
  messagesArray: Array<{ role: string; content: string }> | null;
  roleHint: string | null; // req.body.role
  lineUserId: string | null;
  webUserId: string | null;
  customerName: string | null;
  db: SupabaseClient;
}): Promise<{ handled: true; response: string; intent: RootAiIntent } | { handled: false }> {
  const role = resolveRole({
    ownerId: params.roleHint === "owner" ? params.webUserId : null,
    lineUserId: params.lineUserId,
    webUserId: params.webUserId,
  });

  const userCount = params.messagesArray ? params.messagesArray.filter((m) => m.role === "user").length : 0;
  const assistantCount = params.messagesArray ? params.messagesArray.filter((m) => m.role === "assistant").length : 0;
  const isFirstTurn = userCount === 1 && assistantCount === 0;

  // 2) GREETING STATE (first message only): no services, no shops, no examples.
  if (isFirstTurn) {
    return { handled: true, response: greetingForRole(role, params.customerName), intent: "greeting_only" };
  }

  const intent = detectIntent(params.message);
  if (intent === "greeting_only") {
    return { handled: true, response: greetingForRole(role, params.customerName), intent };
  }
  if (intent === "help") {
    return { handled: true, response: role === "OWNER" ? "Tell me what you want to manage." : "Tell me what you want to do.", intent };
  }
  if (intent === "unknown") {
    return { handled: true, response: role === "OWNER" ? "What would you like to manage today?" : "How can I help you today?", intent };
  }

  if (role === "OWNER") return { handled: false };

  // Service/location prompting for browse/booking.
  const effectiveIntent: RootAiIntent = role === "GUEST" && intent === "booking" ? "browse_shops" : intent;

  const svc = detectService(params.message);
  if (!svc) {
    return { handled: true, response: "What kind of service are you looking for?", intent: effectiveIntent };
  }
  const loc = detectJapanLocation(params.message);
  if (!loc?.variants?.length) {
    return { handled: true, response: "Which area in Japan are you looking in?", intent: effectiveIntent };
  }

  const shops = await queryVerifiedShops({ db: params.db, service: svc.service, locationVariants: loc.variants });
  const response = shops.length > 0 ? formatShopLinks(shops) : "No verified shops found for that service in that area in Japan.";
  return { handled: true, response, intent: effectiveIntent };
}



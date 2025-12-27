// apps/api/src/ai/ai.ts
// STRICT, STATE-DRIVEN, BUTTON-LED FLOW (NO FREE-TEXT INTENT GUESSING).
//
// conversation_state.step is the ONLY source of truth.
// Steps:
// - GREETING -> SERVICE_SELECT -> LOCATION_SELECT -> SHOP_LIST

import type { SupabaseClient } from "@supabase/supabase-js";

export type Channel = "guest" | "web" | "line";
export type Step = "GREETING" | "SERVICE_SELECT" | "LOCATION_SELECT" | "SHOP_LIST" | "END";
export type SelectedService = "Hair" | "Nail" | "Restaurant" | "Massage";
export type SelectedLocation = "Tokyo" | "Shibuya" | "Shinjuku" | "Osaka";

export type QuickReply = { label: string; payload: string };
export type ShopCard = { shop_name: string; address: string | null; href: string; cta: "View Shop" };

export type ButtonFlowResult = {
  response: string;
  quick_replies: QuickReply[] | null;
  shop_cards: ShopCard[] | null;
  step: Step;
  conversation_state_id: string;
};

const SERVICE_REPLIES: QuickReply[] = [
  { label: "Hair", payload: "Hair" },
  { label: "Nail", payload: "Nail" },
  { label: "Restaurant", payload: "Restaurant" },
  { label: "Massage", payload: "Massage" },
];

const LOCATION_REPLIES: QuickReply[] = [
  { label: "Tokyo", payload: "Tokyo" },
  { label: "Shibuya", payload: "Shibuya" },
  { label: "Shinjuku", payload: "Shinjuku" },
  { label: "Osaka", payload: "Osaka" },
];

function norm(s: string): string {
  return String(s || "").trim().toLowerCase();
}

function matchService(message: string): SelectedService | null {
  const t = norm(message);
  if (t === "hair" || t === "haircut" || t === "hair cut") return "Hair";
  if (t === "nail" || t === "nails") return "Nail";
  if (t === "restaurant" || t === "food") return "Restaurant";
  if (t === "massage" || t === "massages") return "Massage";
  return null;
}

function matchLocation(message: string): SelectedLocation | null {
  const t = norm(message);
  if (t === "tokyo") return "Tokyo";
  if (t === "shibuya") return "Shibuya";
  if (t === "shinjuku") return "Shinjuku";
  if (t === "osaka") return "Osaka";
  return null;
}

async function upsertConversationState(
  supabase: SupabaseClient,
  row: any
): Promise<{ id: string; channel: Channel; step: Step; selected_service: string | null; selected_location: string | null; customer_id: string | null }> {
  const { data, error } = await supabase
    .from("conversation_state")
    .upsert(row, { onConflict: "id" })
    .select("id, channel, step, selected_service, selected_location, customer_id")
    .single();
  if (error) throw error;
  return data as any;
}

async function loadConversationState(params: {
  supabase: SupabaseClient;
  conversationStateId: string | null;
  customerId: string | null;
  channel: Channel;
}): Promise<any | null> {
  if (params.conversationStateId) {
    const { data } = await params.supabase.from("conversation_state").select("*").eq("id", params.conversationStateId).maybeSingle();
    return data || null;
  }
  if (params.customerId) {
    const { data } = await params.supabase
      .from("conversation_state")
      .select("*")
      .eq("customer_id", params.customerId)
      .eq("channel", params.channel)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data || null;
  }
  return null;
}

async function listVerifiedShops(params: { supabase: SupabaseClient; service: SelectedService; location: SelectedLocation }): Promise<ShopCard[]> {
  const serviceToCategoryNames: Record<SelectedService, string[]> = {
    Hair: ["Hair Salon", "Barbershop", "Barber Shop"],
    Nail: ["Nail Salon"],
    Restaurant: ["Restaurant", "Izakaya"],
    Massage: ["Massages", "Spa", "Onsen"],
  };

  const { data: cats } = await params.supabase.from("categories").select("id,name").in("name", serviceToCategoryNames[params.service]);
  const categoryIds = (cats || []).map((c: any) => String(c.id));

  let q: any = params.supabase
    .from("shops")
    .select("id,name,address,is_verified,category_id")
    .eq("is_verified", true)
    .ilike("address", `%${params.location}%`)
    .order("name", { ascending: true })
    .limit(20);

  if (categoryIds.length > 0) q = q.in("category_id", categoryIds);

  const { data, error } = await q;
  if (error) throw error;

  return (data || []).map((s: any) => ({
    shop_name: String(s.name),
    address: s.address ? String(s.address) : null,
    href: `/shops/${String(s.id)}`,
    cta: "View Shop",
  }));
}

export async function runButtonLedFlow(params: {
  supabase: SupabaseClient;
  channel: Channel;
  customerId: string | null;
  conversationStateId: string | null;
  message: string;
}): Promise<ButtonFlowResult> {
  let state = await loadConversationState({
    supabase: params.supabase,
    conversationStateId: params.conversationStateId,
    customerId: params.customerId,
    channel: params.channel,
  });

  if (!state) {
    const created = await upsertConversationState(params.supabase, {
      id: params.conversationStateId || undefined,
      customer_id: params.customerId,
      channel: params.channel,
      step: "GREETING",
    });
    state = { ...created, selected_service: null, selected_location: null };
  }

  const step: Step = (state.step as Step) || "GREETING";

  if (step === "GREETING") {
    const response = "Hello, welcome to YoYakuYo 👋  \n\nWhat would you like to do today?";
    const next = await upsertConversationState(params.supabase, {
      id: state.id,
      customer_id: state.customer_id ?? params.customerId,
      channel: state.channel ?? params.channel,
      step: "SERVICE_SELECT",
      last_message_at: new Date().toISOString(),
    });
    return { response, quick_replies: SERVICE_REPLIES, shop_cards: null, step: next.step, conversation_state_id: String(next.id) };
  }

  if (step === "SERVICE_SELECT") {
    const svc = matchService(params.message);
    if (!svc) {
      const next = await upsertConversationState(params.supabase, { id: state.id, last_message_at: new Date().toISOString() });
      return { response: "", quick_replies: SERVICE_REPLIES, shop_cards: null, step: next.step, conversation_state_id: String(next.id) };
    }
    const response = "Great 👍  \n\nWhich area are you looking in?";
    const next = await upsertConversationState(params.supabase, {
      id: state.id,
      customer_id: state.customer_id ?? params.customerId,
      channel: state.channel ?? params.channel,
      selected_service: svc,
      step: "LOCATION_SELECT",
      last_message_at: new Date().toISOString(),
    });
    return { response, quick_replies: LOCATION_REPLIES, shop_cards: null, step: next.step, conversation_state_id: String(next.id) };
  }

  if (step === "LOCATION_SELECT") {
    const loc = matchLocation(params.message);
    if (!loc) {
      const next = await upsertConversationState(params.supabase, { id: state.id, last_message_at: new Date().toISOString() });
      return { response: "", quick_replies: LOCATION_REPLIES, shop_cards: null, step: next.step, conversation_state_id: String(next.id) };
    }

    const selectedService = (state.selected_service as SelectedService | null) || null;
    const service = selectedService || "Hair";
    const shop_cards = await listVerifiedShops({ supabase: params.supabase, service, location: loc });
    const response = `Here are the verified ${service} shops in ${loc}:`;

    const next = await upsertConversationState(params.supabase, {
      id: state.id,
      customer_id: state.customer_id ?? params.customerId,
      channel: state.channel ?? params.channel,
      selected_location: loc,
      step: "SHOP_LIST",
      last_message_at: new Date().toISOString(),
    });

    if ((next.channel as Channel) === "guest" && next.customer_id) {
      await params.supabase.from("guest_identity").upsert({ id: next.customer_id }, { onConflict: "id" });
    }

    return { response, quick_replies: null, shop_cards, step: next.step, conversation_state_id: String(next.id) };
  }

  const next = await upsertConversationState(params.supabase, { id: state.id, last_message_at: new Date().toISOString() });
  return { response: "", quick_replies: null, shop_cards: null, step: next.step, conversation_state_id: String(next.id) };
}



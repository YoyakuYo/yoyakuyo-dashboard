// apps/api/src/services/aiContextService.ts
// Single source of truth for what the AI is allowed to know.

import type { Request } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase";

const dbClient = supabaseAdmin || supabase;

export type AIContextCustomerType = "line" | "web" | "guest";

export type AIContext = {
  app: {
    name: "Yoyakuyo";
    description: string;
    features: Array<"booking" | "chat" | "favorites">;
    supportedCustomers: Array<"line" | "web" | "guest">;
  };
  customer: {
    id: string | null;
    type: AIContextCustomerType;
    name?: string | null;
  };
  verifiedShops: Array<{
    shop_id: string;
    name: string | null;
    location: string | null;
    services: Array<{
      id: string;
      name: string | null;
      duration_minutes?: number | null;
      duration?: number | null;
    }>;
    booking_enabled: boolean;
  }>;
};

function coerceInt(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

async function resolveCustomerFromRequest(req: Request): Promise<AIContext["customer"]> {
  const lineUserId = (req.headers["x-line-user-id"] as string | undefined) || null;
  const webUserId = (req.headers["x-user-id"] as string | undefined) || null;
  const anonymousSessionId =
    (req.headers["x-anonymous-session-id"] as string | undefined) ||
    (req.query.anonymousSessionId as string | undefined) ||
    null;

  // LINE customer
  if (lineUserId) {
    try {
      const { data: mapping } = await dbClient
        .from("line_user_mappings")
        .select("customer_id, line_display_name")
        .eq("line_user_id", lineUserId)
        .maybeSingle();

      return {
        id: (mapping?.customer_id as string | undefined) || lineUserId,
        type: "line",
        name: (mapping?.line_display_name as string | undefined) || null,
      };
    } catch {
      return { id: lineUserId, type: "line", name: null };
    }
  }

  // Web customer
  if (webUserId) {
    try {
      const { data: customer } = await dbClient
        .from("customers")
        .select("id, name")
        .eq("id", webUserId)
        .maybeSingle();

      return {
        id: (customer?.id as string | undefined) || webUserId,
        type: "web",
        name: (customer as any)?.name ?? null,
      };
    } catch {
      return { id: webUserId, type: "web", name: null };
    }
  }

  // Guest
  return { id: anonymousSessionId, type: "guest", name: null };
}

export async function buildAIContext(req: Request): Promise<AIContext> {
  const limit = Math.min(Math.max(coerceInt(req.query.limit, 200), 1), 1000);
  const offset = Math.max(coerceInt(req.query.offset, 0), 0);

  const customer = await resolveCustomerFromRequest(req);

  // Fetch verified shops only (MANDATORY)
  const { data: shops, error: shopsError } = await dbClient
    .from("shops")
    .select("id, name, address, city, prefecture, is_published")
    .eq("is_verified", true)
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (shopsError) {
    throw new Error(shopsError.message);
  }

  const shopList = Array.isArray(shops) ? shops : [];
  const shopIds = shopList.map((s: any) => s.id).filter(Boolean);

  // Fetch services for those verified shops
  let servicesByShopId = new Map<string, AIContext["verifiedShops"][number]["services"]>();
  if (shopIds.length > 0) {
    const { data: services, error: servicesError } = await dbClient
      .from("services")
      .select("id, shop_id, name, duration_minutes, duration")
      .in("shop_id", shopIds)
      .order("name", { ascending: true });

    if (servicesError) {
      throw new Error(servicesError.message);
    }

    servicesByShopId = new Map();
    for (const svc of Array.isArray(services) ? (services as any[]) : []) {
      const sid = String(svc.shop_id);
      const arr = servicesByShopId.get(sid) || [];
      arr.push({
        id: String(svc.id),
        name: svc.name ?? null,
        duration_minutes: svc.duration_minutes ?? null,
        duration: svc.duration ?? null,
      });
      servicesByShopId.set(sid, arr);
    }
  }

  const verifiedShops: AIContext["verifiedShops"] = shopList.map((s: any) => {
    const location = (s.address || s.city || s.prefecture || null) as string | null;
    return {
      shop_id: String(s.id),
      name: s.name ?? null,
      location,
      services: servicesByShopId.get(String(s.id)) || [],
      booking_enabled: Boolean(s.is_published),
    };
  });

  return {
    app: {
      name: "Yoyakuyo",
      description: "Booking platform for verified shops",
      features: ["booking", "chat", "favorites"],
      supportedCustomers: ["line", "web", "guest"],
    },
    customer,
    verifiedShops,
  };
}



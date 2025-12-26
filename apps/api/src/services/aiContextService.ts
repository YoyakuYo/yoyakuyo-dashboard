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
    name: string | null;
    isAuthenticated: boolean;
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

function formatCustomerName(row: any): string | null {
  const name = (row?.name as string | undefined) || null;
  if (name && name.trim()) return name.trim();

  const first = (row?.first_name as string | undefined) || "";
  const last = (row?.last_name as string | undefined) || "";
  const full = `${first} ${last}`.trim();
  return full ? full : null;
}

/**
 * Resolve customer identity ONLY from headers (no Supabase Auth session).
 * This MUST run before any AI message is sent.
 */
export async function resolveCustomerIdentity(req: Request): Promise<AIContext["customer"]> {
  const lineUserId = (req.headers["x-line-user-id"] as string | undefined) || null;
  const webUserId =
    (req.headers["x-customer-id"] as string | undefined) ||
    (req.headers["x-user-id"] as string | undefined) ||
    null;
  const guestId =
    (req.headers["x-guest-id"] as string | undefined) ||
    (req.headers["x-booking-token"] as string | undefined) ||
    (req.headers["x-anonymous-session-id"] as string | undefined) ||
    (req.query.anonymousSessionId as string | undefined) ||
    null;

  // LINE customer
  if (lineUserId) {
    try {
      // Resolve canonical customer_id from LINE mapping
      const { data: mapping } = await dbClient
        .from("line_user_mappings")
        .select("customer_id")
        .eq("line_user_id", lineUserId)
        .maybeSingle();

      const customerId = (mapping?.customer_id as string | undefined) || null;

      // Fetch customer name from customers table (MANDATORY requirement)
      let name: string | null = null;
      if (customerId) {
        const { data: customerRow } = await dbClient
          .from("customers")
          .select("id, name, first_name, last_name")
          .eq("id", customerId)
          .maybeSingle();
        name = formatCustomerName(customerRow);
      }

      return {
        id: customerId || lineUserId,
        type: "line",
        name,
        isAuthenticated: true,
      };
    } catch {
      return { id: lineUserId, type: "line", name: null, isAuthenticated: true };
    }
  }

  // Web customer
  if (webUserId) {
    try {
      const { data: customer } = await dbClient
        .from("customers")
        .select("id, name, first_name, last_name")
        .eq("id", webUserId)
        .maybeSingle();

      return {
        id: (customer?.id as string | undefined) || webUserId,
        type: "web",
        name: formatCustomerName(customer),
        isAuthenticated: true,
      };
    } catch {
      return { id: webUserId, type: "web", name: null, isAuthenticated: true };
    }
  }

  // Guest
  return { id: guestId, type: "guest", name: null, isAuthenticated: false };
}

export async function buildAIContext(req: Request): Promise<AIContext> {
  const limit = Math.min(Math.max(coerceInt(req.query.limit, 200), 1), 1000);
  const offset = Math.max(coerceInt(req.query.offset, 0), 0);

  const customer = await resolveCustomerIdentity(req);

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



// apps/api/src/services/aiActionsService.ts
// Backend action endpoints the AI is allowed to call.

import type { Request } from "express";
import crypto from "crypto";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { checkTimeSlotAvailability } from "./availabilityService";
import { createBookingFromAi } from "./bookingService";

const dbClient = supabaseAdmin || supabase;

export type AiBookActionInput = {
  shop_id: string;
  service_id: string;
  staff_id?: string | null;
  start_time: string;
  end_time?: string | null; // optional; can be derived from service duration
  customer_name: string;
  customer_email?: string | null; // optional; can be placeholder
  customer_phone?: string | null;
  notes?: string | null;
};

export type AiBookActionResult =
  | {
      ok: true;
      booking: {
        id: string;
        shop_id: string;
        service_id: string | null;
        staff_id: string | null;
        start_time: string;
        end_time: string;
        status: string | null;
      };
    }
  | {
      ok: false;
      status: 400 | 401 | 403 | 404 | 409 | 500;
      error: string;
      details?: any;
    };

async function resolveCustomerForRequest(req: Request): Promise<{
  customerId: string | null;
  customerType: "line" | "web" | "guest";
}> {
  const lineUserId = (req.headers["x-line-user-id"] as string | undefined) || null;
  const webUserId = (req.headers["x-user-id"] as string | undefined) || null;

  if (lineUserId) {
    const { data: mapping } = await dbClient
      .from("line_user_mappings")
      .select("customer_id")
      .eq("line_user_id", lineUserId)
      .maybeSingle();

    return { customerId: (mapping?.customer_id as string | undefined) || null, customerType: "line" };
  }

  if (webUserId) {
    // Ensure customer exists in canonical customers table (non-fatal if it already exists)
    try {
      const { data: existing } = await dbClient
        .from("customers")
        .select("id")
        .eq("id", webUserId)
        .maybeSingle();

      if (!existing?.id) {
        await dbClient.from("customers").insert({ id: webUserId, role: "customer" });
      }
    } catch {
      // If insert fails due to RLS/constraints, we still treat the header as the identity.
    }

    return { customerId: webUserId, customerType: "web" };
  }

  // Guest: create a canonical guest customer (best-effort)
  const guestId = crypto.randomUUID();
  try {
    await dbClient.from("customers").insert({ id: guestId, role: "guest" });
    return { customerId: guestId, customerType: "guest" };
  } catch {
    return { customerId: null, customerType: "guest" };
  }
}

export async function bookVerifiedShopAction(req: Request, input: AiBookActionInput): Promise<AiBookActionResult> {
  try {
    if (!input.shop_id || !input.service_id || !input.start_time || !input.customer_name) {
      return { ok: false, status: 400, error: "Missing required fields: shop_id, service_id, start_time, customer_name" };
    }

    const { customerId } = await resolveCustomerForRequest(req);
    // Validate customer (per requirements): for guests, we at least require a name; for web/line, header identity is required.
    const hasAnyIdentity = Boolean(req.headers["x-line-user-id"] || req.headers["x-user-id"] || customerId);
    if (!hasAnyIdentity && !input.customer_name) {
      return { ok: false, status: 401, error: "Customer validation failed" };
    }

    // Validate shop is verified (HARD GUARD)
    const { data: shop, error: shopError } = await dbClient
      .from("shops")
      .select("id, is_verified, is_published")
      .eq("id", input.shop_id)
      .maybeSingle();

    if (shopError) return { ok: false, status: 500, error: "Failed to load shop", details: shopError };
    if (!shop?.id) return { ok: false, status: 404, error: "Shop not found" };
    if (!shop.is_verified) return { ok: false, status: 403, error: "Shop is not verified" };

    // Validate service belongs to shop and determine duration if needed
    const { data: service, error: serviceError } = await dbClient
      .from("services")
      .select("id, shop_id, duration_minutes, duration")
      .eq("id", input.service_id)
      .eq("shop_id", input.shop_id)
      .maybeSingle();

    if (serviceError) return { ok: false, status: 500, error: "Failed to load service", details: serviceError };
    if (!service?.id) return { ok: false, status: 400, error: "Invalid service_id for this shop" };

    const startTime = new Date(input.start_time);
    if (Number.isNaN(startTime.getTime())) return { ok: false, status: 400, error: "Invalid start_time" };

    let endTimeIso: string;
    if (input.end_time) {
      const endTime = new Date(input.end_time);
      if (Number.isNaN(endTime.getTime())) return { ok: false, status: 400, error: "Invalid end_time" };
      endTimeIso = endTime.toISOString();
    } else {
      const durationMinutes = (service as any).duration_minutes ?? (service as any).duration ?? 60;
      const end = new Date(startTime.getTime() + Number(durationMinutes) * 60_000);
      endTimeIso = end.toISOString();
    }

    // Validate availability
    const availability = await checkTimeSlotAvailability(
      input.shop_id,
      startTime.toISOString(),
      endTimeIso,
      input.staff_id || null
    );
    if (!availability.isAvailable) {
      return { ok: false, status: 409, error: availability.reason || "Time slot not available" };
    }

    const placeholderEmail =
      input.customer_email ||
      (input.customer_name ? `${input.customer_name.toLowerCase().replace(/\s+/g, ".")}@bookyo.guest` : "guest@bookyo.guest");

    const result = await createBookingFromAi({
      shopId: input.shop_id,
      serviceId: input.service_id,
      staffId: input.staff_id || null,
      timeslotId: null,
      startTime: startTime.toISOString(),
      endTime: endTimeIso,
      customerName: input.customer_name,
      customerEmail: placeholderEmail,
      customerPhone: input.customer_phone || null,
      notes: input.notes || "Created via AI action endpoint",
      source: "ai",
      customerId: customerId,
      customerProfileId: null,
    });

    if (!result.success || !result.booking?.id) {
      return { ok: false, status: 500, error: result.error || "Failed to create booking" };
    }

    return {
      ok: true,
      booking: {
        id: String(result.booking.id),
        shop_id: String(result.booking.shop_id),
        service_id: result.booking.service_id ? String(result.booking.service_id) : null,
        staff_id: result.booking.staff_id ? String(result.booking.staff_id) : null,
        start_time: String(result.booking.start_time),
        end_time: String(result.booking.end_time),
        status: result.booking.status ? String(result.booking.status) : null,
      },
    };
  } catch (error: any) {
    return { ok: false, status: 500, error: error?.message || "Unknown error" };
  }
}



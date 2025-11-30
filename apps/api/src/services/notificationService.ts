// apps/api/src/services/notificationService.ts
// Notification service for creating customer and owner notifications

import { supabase } from '../lib/supabase';

/**
 * Create a notification for a customer
 */
export async function createCustomerNotification(
  customerProfileId: string,
  type: string,
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
      recipient_type: "customer",
      recipient_id: customerProfileId,
      type: type,
      title: title,
      body: body,
      data: data || {},
      is_read: false,
    });

    if (error) {
      console.error("Error creating customer notification:", error);
    } else {
      console.log(`✅ Notification created for customer ${customerProfileId}: ${title}`);
    }
  } catch (error) {
    console.error("Unexpected error creating customer notification:", error);
  }
}

/**
 * Create a notification for an owner
 */
export async function createOwnerNotification(
  ownerUserId: string,
  type: string,
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
      recipient_type: "owner",
      recipient_id: ownerUserId,
      type: type,
      title: title,
      body: body,
      data: data || {},
      is_read: false,
    });

    if (error) {
      console.error("Error creating owner notification:", error);
    } else {
      console.log(`✅ Notification created for owner ${ownerUserId}: ${title}`);
    }
  } catch (error) {
    console.error("Unexpected error creating owner notification:", error);
  }
}

/**
 * Get customer_profile_id from customer_id (legacy support)
 */
export async function getCustomerProfileId(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  
  try {
    // Try to find customer_profile by customer_id
    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("id")
      .eq("id", customerId)
      .maybeSingle();
    
    return profile?.id || null;
  } catch (error) {
    console.error("Error getting customer profile ID:", error);
    return null;
  }
}


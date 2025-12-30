// apps/api/src/services/bookingService.ts
// Reusable booking creation service for AI and manual booking flows

import { supabaseAdmin, supabase } from '../lib/supabase';
import { findOrCreateCustomer } from './customerService';
import { ensureCustomerId } from './customerIdService';

const dbClient = supabaseAdmin || supabase;

export type CreateBookingInput = {
  shopId: string;
  serviceId?: string | null;
  staffId?: string | null;
  timeslotId?: string | null;
  startTime: string; // ISO string
  endTime: string; // ISO string
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  languageCode?: string | null;
  notes?: string | null;
  source: 'ai' | 'manual';
  customerId?: string | null; // Optional: for owner-created bookings
};

export interface BookingResult {
  success: boolean;
  booking?: any;
  error?: string;
}

/**
 * Creates a booking in Supabase from AI conversation or manual flow
 * Reuses the same table and defaults as the existing manual booking flow
 */
export async function createBookingFromAi(input: CreateBookingInput): Promise<BookingResult> {
  try {
    // Validate required fields (NO email/phone required - only name)
    if (!input.shopId || !input.customerName) {
      return {
        success: false,
        error: 'shopId and customerName are required',
      };
    }

    if (!input.startTime || !input.endTime) {
      return {
        success: false,
        error: 'startTime and endTime are required',
      };
    }

    // Validate that start_time is in the future
    const startDate = new Date(input.startTime);
    const now = new Date();
    if (startDate <= now) {
      return {
        success: false,
        error: 'startTime must be in the future',
      };
    }

    // Validate that end_time is after start_time
    const endDate = new Date(input.endTime);
    if (endDate <= startDate) {
      return {
        success: false,
        error: 'endTime must be after startTime',
      };
    }

    // Create or find customer record (NO email/phone - only name)
    // Use a placeholder email for customer lookup (will be replaced by permanent ID system)
    const placeholderEmail = `customer_${Date.now()}@yoyaku-yo.temp`;
    const { customerId } = await findOrCreateCustomer(
      placeholderEmail,
      input.customerName,
      undefined // No phone
    );

    // Ensure customer has permanent ID and magic code
    if (customerId) {
      try {
        await ensureCustomerId(customerId, input.customerName);
      } catch (idError) {
        console.error('Error ensuring customer ID:', idError);
        // Continue even if ID generation fails
      }
    }

    // Prepare booking data (same structure as manual booking flow)
    const bookingData: any = {
      shop_id: input.shopId,
      service_id: input.serviceId || null,
      staff_id: input.staffId || null,
      timeslot_id: input.timeslotId || null,
      start_time: input.startTime,
      end_time: input.endTime,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone || null,
      language_code: input.languageCode || null,
      notes: input.notes || null,
      customer_id: input.customerId || customerId || null, // Use created customer ID if available
      status: 'pending', // Same default as manual booking flow
      created_by_ai: true, // Mark as AI-created booking
    };

    // Insert booking into Supabase
    const { data: newBooking, error } = await dbClient
      .from('bookings')
      .insert([bookingData])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating booking from AI:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Send LINE notification if customer has LINE connected (non-blocking)
    if (customerId) {
      try {
        const { sendBookingConfirmation } = await import('./lineService');
        const shop = await getShopDetails(input.shopId);
        const service = input.serviceId ? await getServiceDetails(input.serviceId) : null;
        
        if (shop && service) {
          const startDate = new Date(input.startTime);
          sendBookingConfirmation(customerId, {
            shopName: shop.name || 'Shop',
            serviceName: service.name || 'Service',
            date: startDate.toLocaleDateString('ja-JP'),
            time: startDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            bookingId: newBooking.id,
          }).catch((err) => {
            console.error('Failed to send LINE notification (non-blocking):', err);
          });
        }
      } catch (lineError) {
        // LINE notification is optional - don't fail booking if it fails
        console.error('LINE notification error (non-blocking):', lineError);
      }
    }

    return {
      success: true,
      booking: newBooking,
    };
  } catch (error: any) {
    console.error('Error in createBookingFromAi:', error);
    return {
      success: false,
      error: error.message || 'Unknown error creating booking',
    };
  }
}

/**
 * Fetches shop details for booking confirmation
 */
export async function getShopDetails(shopId: string) {
  try {
    const { data: shop, error } = await dbClient
      .from('shops')
      .select('id, name, category, description, address, phone, email, city, prefecture, opening_hours')
      .eq('id', shopId)
      .single();

    if (error) {
      console.error('Error fetching shop details:', error);
      return null;
    }

    return shop;
  } catch (error) {
    console.error('Error in getShopDetails:', error);
    return null;
  }
}

/**
 * Fetches service details for booking confirmation
 */
export async function getServiceDetails(serviceId: string) {
  try {
    const { data: service, error } = await dbClient
      .from('services')
      .select('id, name, duration_minutes, duration, price')
      .eq('id', serviceId)
      .single();

    if (error) {
      console.error('Error fetching service details:', error);
      return null;
    }

    return service;
  } catch (error) {
    console.error('Error in getServiceDetails:', error);
    return null;
  }
}

/**
 * Fetches staff details for booking confirmation
 */
export async function getStaffDetails(staffId: string) {
  try {
    const { data: staff, error } = await dbClient
      .from('staff')
      .select('id, first_name, last_name')
      .eq('id', staffId)
      .single();

    if (error) {
      console.error('Error fetching staff details:', error);
      return null;
    }

    return staff;
  } catch (error) {
    console.error('Error in getStaffDetails:', error);
    return null;
  }
}

/**
 * Fetches all services for a shop (for AI to match service names to IDs)
 */
export async function getShopServices(shopId: string) {
  try {
    const { data: services, error } = await dbClient
      .from('services')
      .select('id, name, duration_minutes, duration')
      .eq('shop_id', shopId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching shop services:', error);
      return [];
    }

    return services || [];
  } catch (error) {
    console.error('Error in getShopServices:', error);
    return [];
  }
}

/**
 * Fetches all staff for a shop (for AI to match staff names to IDs)
 */
export async function getShopStaff(shopId: string) {
  try {
    const { data: staff, error } = await dbClient
      .from('staff')
      .select('id, first_name, last_name')
      .eq('shop_id', shopId)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching shop staff:', error);
      return [];
    }

    return staff || [];
  } catch (error) {
    console.error('Error in getShopStaff:', error);
    return [];
  }
}


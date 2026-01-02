// apps/dashboard/lib/utils/aiBookingClient.ts
// Shared helper function for automatic booking via AI

import { apiUrl } from '../apiClient';

export interface AutoBookParams {
  shopId: string;
  customerName: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format (24-hour)
  notes?: string;
}

export interface AutoBookResult {
  success: boolean;
  booking_id?: string;
  confirmed_date?: string;
  confirmed_time?: string;
  shop_name?: string;
  error?: string;
  message?: string;
}

/**
 * Automatically create a booking via the AI auto-booking API
 * Used by both customer and owner AI assistants
 */
export async function autoBook(params: AutoBookParams): Promise<AutoBookResult> {
  try {
    const response = await fetch(`${apiUrl}/api/ai/auto-book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shop_id: params.shopId,
        customer_name: params.customerName,
        requested_date: params.date,
        requested_time: params.time,
        notes: params.notes || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'unknown_error',
        message: data.message || 'Failed to create booking',
      };
    }

    return {
      success: true,
      booking_id: data.booking_id,
      confirmed_date: data.confirmed_date,
      confirmed_time: data.confirmed_time,
      shop_name: data.shop_name,
    };
  } catch (error: any) {
    console.error('Error in autoBook:', error);
    return {
      success: false,
      error: 'network_error',
      message: error.message || 'Network error occurred',
    };
  }
}


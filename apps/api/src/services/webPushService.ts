// apps/api/src/services/webPushService.ts
// Web Push notification service for customers

import * as webpush from 'web-push';
import { supabaseAdmin, supabase } from '../lib/supabase';
import { generateMultilingualResponse } from './multilingualService';
import { getCustomerLanguage } from './customerService';

const dbClient = supabaseAdmin || supabase;

// Initialize VAPID keys (safe - only initializes if keys exist)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@yoyaku-yo.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      'mailto:omar@example.com',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    console.log('[WebPush] ✅ VAPID keys configured');
  } catch (err: any) {
    console.warn("⚠️ WebPush VAPID config error, continuing without push notifications:", err.message);
  }
} else {
  console.warn('[WebPush] ⚠️  VAPID keys not configured - Web Push will be disabled (this is safe)');
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Save customer's push subscription (safe - won't break if table doesn't exist yet)
 */
export async function saveCustomerPushSubscription(
  customerId: string,
  subscription: PushSubscription,
  userAgent?: string
): Promise<boolean> {
  try {
    // Check if VAPID keys are configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.log('[WebPush] VAPID keys not configured, skipping subscription save');
      return false;
    }

    const { error } = await dbClient
      .from('customer_push_subscriptions')
      .upsert({
        customer_id: customerId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent || null,
      }, {
        onConflict: 'customer_id,endpoint',
      });

    if (error) {
      // Safe: If table doesn't exist, just log and return false
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.log('[WebPush] Push subscriptions table not found - run migration first');
        return false;
      }
      console.error('[WebPush] Error saving push subscription:', error);
      return false;
    }

    return true;
  } catch (error: any) {
    // Safe: Catch all errors and return false instead of throwing
    console.error('[WebPush] Error saving push subscription:', error);
    return false;
  }
}

/**
 * Send Web Push notification to customer (safe - gracefully handles missing setup)
 */
export async function sendWebPushToCustomer(
  customerId: string,
  title: string,
  message: string,
  url?: string
): Promise<boolean> {
  try {
    // Safe: Check if VAPID keys are configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.log(`[WebPush] VAPID keys not configured, skipping push to customer ${customerId}`);
      return false;
    }

    // Get all push subscriptions for this customer
    const { data: subscriptions, error } = await dbClient
      .from('customer_push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('customer_id', customerId);

    // Safe: If table doesn't exist or no subscriptions, just return false
    if (error) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.log('[WebPush] Push subscriptions table not found - run migration first');
        return false;
      }
      console.error('[WebPush] Error fetching subscriptions:', error);
      return false;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[WebPush] No subscriptions found for customer ${customerId}`);
      return false;
    }

    // Get customer language for localized message (safe - handles errors)
    let customerLang = 'en';
    try {
      customerLang = await getCustomerLanguage(null, customerId);
    } catch (langError) {
      console.warn('[WebPush] Error getting customer language, using English:', langError);
    }

    const localizedMessage = await generateMultilingualResponse('what_can_i_help', customerLang) + ' ' + message;

    const payload = JSON.stringify({
      title,
      body: localizedMessage,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        url: url || '/',
        customerId,
      },
    });

    // Send to all subscriptions (safe - handles failures gracefully)
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
          return true;
        } catch (error: any) {
          // If subscription is invalid (410 Gone or 404 Not Found), remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[WebPush] Removing invalid subscription: ${sub.endpoint}`);
            try {
              await dbClient
                .from('customer_push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint);
            } catch (deleteError) {
              // Safe: Ignore delete errors
              console.warn('[WebPush] Error removing invalid subscription:', deleteError);
            }
          }
          throw error;
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[WebPush] Sent to ${successCount}/${subscriptions.length} subscriptions for customer ${customerId}`);
    
    return successCount > 0;
  } catch (error: any) {
    // Safe: Catch all errors and return false instead of throwing
    console.error('[WebPush] Error sending web push:', error);
    return false;
  }
}

/**
 * Send notification when booking is cancelled/rescheduled (safe - handles errors gracefully)
 */
export async function notifyCustomerBookingChange(
  customerId: string,
  action: 'cancelled' | 'rescheduled',
  bookingDetails: {
    date: string;
    time: string;
    serviceName?: string;
  },
  reason?: string
): Promise<boolean> {
  try {
    // Safe: Get customer language with proper error handling
    let customerLang = 'en';
    try {
      customerLang = await getCustomerLanguage(null, customerId);
    } catch (langError) {
      console.warn('[WebPush] Error getting customer language, using English:', langError);
    }
    
    let titleKey = 'booking_cancelled';
    if (action === 'rescheduled') {
      titleKey = 'reschedule_message';
    }
    
    const title = await generateMultilingualResponse(titleKey, customerLang);
    const message = `${bookingDetails.serviceName || 'Booking'} on ${bookingDetails.date} at ${bookingDetails.time}`;
    
    // Get customer's magic code for chat URL (safe - handles missing customer)
    let chatUrl: string | undefined;
    try {
      const { data: customer } = await dbClient
        .from('customers')
        .select('magic_code')
        .eq('id', customerId)
        .single();
      
      if (customer?.magic_code) {
        const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_API_URL?.replace(':3000', ':3001') || 'http://localhost:3001';
        chatUrl = `${frontendUrl}/c/${customer.magic_code}`;
      }
    } catch (customerError) {
      console.warn('[WebPush] Error getting customer magic code:', customerError);
      // Continue without chat URL
    }
    
    return await sendWebPushToCustomer(
      customerId,
      title,
      message,
      chatUrl
    );
  } catch (error: any) {
    // Safe: Catch all errors and return false instead of throwing
    console.error('[WebPush] Error notifying customer of booking change:', error);
    return false;
  }
}


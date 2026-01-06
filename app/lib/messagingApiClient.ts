// Unified messaging API client
// ALWAYS injects X-User-Id for all messaging API calls
// Maps LINE users to canonical customer_id

import { apiUrl } from '@/lib/apiClient';

interface MessagingApiOptions {
  lineUserId?: string;
  idToken?: string;
  userId?: string; // Web user ID
  bookingToken?: string; // Guest booking token
}

/**
 * Resolve canonical user_id from LINE user
 * For LINE users, we need to map line_user_id -> customer_id
 * FALLBACK: Try multiple endpoints to ensure we get customer_id
 */
async function resolveUserId(options: MessagingApiOptions): Promise<string | null> {
  const { lineUserId, idToken, userId, bookingToken } = options;
  
  // If web user, use userId directly
  if (userId) {
    return userId;
  }
  
  // If LINE user, resolve customer_id from line_accounts
  if (lineUserId && idToken) {
    // Try resolve-user-id endpoint first
    try {
      const res = await fetch(`${apiUrl}/api/internal-messaging/resolve-user-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-line-user-id': lineUserId,
          'x-id-token': idToken,
        },
        body: JSON.stringify({ line_user_id: lineUserId }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const resolvedUserId = data.user_id || data.customer_id;
        if (resolvedUserId) {
          console.log('[Messaging API Client] ✅ Resolved user_id via resolve-user-id:', resolvedUserId);
          return resolvedUserId;
        }
      }
    } catch (error) {
      console.warn('[Messaging API Client] ⚠️ resolve-user-id failed, trying fallback:', error);
    }
    
    // FALLBACK: Try liff/verify endpoint
    try {
      const verifyRes = await fetch(`${apiUrl}/api/line/liff/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token: idToken }),
      });
      
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        const resolvedUserId = verifyData.customer_id || verifyData.user_id;
        if (resolvedUserId) {
          console.log('[Messaging API Client] ✅ Resolved user_id via liff/verify:', resolvedUserId);
          return resolvedUserId;
        }
      }
    } catch (error) {
      console.warn('[Messaging API Client] ⚠️ liff/verify fallback also failed:', error);
    }
    
    console.error('[Messaging API Client] ❌ All resolution methods failed for LINE user:', lineUserId);
  }
  
  // For guests, return null (they use booking_token)
  if (bookingToken) {
    return null;
  }
  
  return null;
}

/**
 * Get auth headers for messaging API calls
 * ALWAYS includes identity headers - NEVER relies on Supabase Auth
 */
export async function getMessagingAuthHeaders(options: MessagingApiOptions): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // CRITICAL: ALWAYS send LINE identity headers if available
  // Backend will resolve customer_id from these headers
  if (options.lineUserId) {
    headers['x-line-user-id'] = options.lineUserId;
  }
  
  if (options.idToken) {
    headers['x-id-token'] = options.idToken;
  }
  
  // Try to resolve canonical user_id, but don't block if it fails
  // Backend can resolve from line_user_id if needed
  try {
    const userId = await resolveUserId(options);
    if (userId) {
      headers['x-user-id'] = userId;
      headers['x-customer-id'] = userId; // Also send as customer-id for compatibility
    }
  } catch (error) {
    console.warn('[Messaging API Client] ⚠️ Failed to resolve user_id, but continuing with LINE headers:', error);
    // Continue anyway - backend can resolve from x-line-user-id
  }
  
  // Web user ID (direct)
  if (options.userId) {
    headers['x-user-id'] = options.userId;
    headers['x-customer-id'] = options.userId;
  }
  
  // Guest booking token
  if (options.bookingToken) {
    headers['x-booking-token'] = options.bookingToken;
    headers['x-guest-id'] = options.bookingToken;
  }
  
  return headers;
}

/**
 * Fetch wrapper that ALWAYS includes X-User-Id
 */
export async function messagingFetch(
  url: string,
  options: MessagingApiOptions & {
    method?: string;
    body?: any;
  }
): Promise<Response> {
  let { method = 'GET', body, ...authOptions } = options;

  // If body is provided but method is GET/HEAD, automatically use POST
  // GET/HEAD requests cannot have a body
  if (body && (method === 'GET' || method === 'HEAD')) {
    console.warn('[Messaging API Client] Body provided with GET/HEAD method, automatically switching to POST');
    method = 'POST';
  }

  const headers = await getMessagingAuthHeaders(authOptions);

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  // DEBUG: Log the actual request being made
  console.log('[Messaging API Client] Making request:', {
    url,
    method,
    hasBody: !!body,
    headers: Object.keys(headers)
  });

  return fetch(url, fetchOptions);
}


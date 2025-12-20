// Unified messaging API client
// ALWAYS injects X-User-Id for all messaging API calls
// Maps LINE users to canonical customer_id

import { apiUrl } from './apiClient';

interface MessagingApiOptions {
  lineUserId?: string;
  idToken?: string;
  userId?: string; // Web user ID
  bookingToken?: string; // Guest booking token
}

/**
 * Resolve canonical user_id from LINE user
 * For LINE users, we need to map line_user_id -> customer_id
 */
async function resolveUserId(options: MessagingApiOptions): Promise<string | null> {
  const { lineUserId, idToken, userId, bookingToken } = options;
  
  // If web user, use userId directly
  if (userId) {
    return userId;
  }
  
  // If LINE user, resolve customer_id from line_accounts
  if (lineUserId && idToken) {
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
        return data.user_id || null;
      }
    } catch (error) {
      console.error('[Messaging API Client] Error resolving user_id:', error);
    }
  }
  
  // For guests, return null (they use booking_token)
  if (bookingToken) {
    return null;
  }
  
  return null;
}

/**
 * Get auth headers for messaging API calls
 * ALWAYS includes X-User-Id if available
 */
export async function getMessagingAuthHeaders(options: MessagingApiOptions): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Resolve canonical user_id
  const userId = await resolveUserId(options);
  
  // ALWAYS inject X-User-Id if available
  if (userId) {
    headers['x-user-id'] = userId;
  }
  
  // Also include original identity headers for backward compatibility
  if (options.lineUserId) {
    headers['x-line-user-id'] = options.lineUserId;
  }
  
  if (options.idToken) {
    headers['x-id-token'] = options.idToken;
  }
  
  if (options.userId) {
    headers['x-user-id'] = options.userId; // Override with direct userId if provided
  }
  
  if (options.bookingToken) {
    headers['x-booking-token'] = options.bookingToken;
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
  const { method = 'GET', body, ...authOptions } = options;
  
  const headers = await getMessagingAuthHeaders(authOptions);
  
  const fetchOptions: RequestInit = {
    method,
    headers,
  };
  
  if (body) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  
  return fetch(url, fetchOptions);
}


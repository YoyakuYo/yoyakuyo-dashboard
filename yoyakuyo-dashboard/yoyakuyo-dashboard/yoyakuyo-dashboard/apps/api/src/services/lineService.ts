// apps/api/src/services/lineService.ts
// LINE integration service

import { Client, middleware, WebhookEvent, TextMessage, Message } from '@line/bot-sdk';
import { supabaseAdmin, supabase } from '../lib/supabase';

const dbClient = supabaseAdmin || supabase;

// LINE configuration (with graceful degradation if keys missing)
const LINE_LOGIN_CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID;
const LINE_LOGIN_CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET;
const LINE_MESSAGING_CHANNEL_ID = process.env.LINE_MESSAGING_CHANNEL_ID;
const LINE_MESSAGING_CHANNEL_SECRET = process.env.LINE_MESSAGING_CHANNEL_SECRET;
const LINE_MESSAGING_ACCESS_TOKEN = process.env.LINE_MESSAGING_ACCESS_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Helper function to get redirect URI with proper prefix
// Uses /api/line/ prefix when API_URL is set (production/ngrok), /line/ for localhost
const getRedirectUri = (endpoint: string): string => {
  if (process.env.LINE_REDIRECT_URI && endpoint === '/callback') {
    return process.env.LINE_REDIRECT_URI;
  }
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  // If API_URL is set and not localhost, use /api prefix (for ngrok/production)
  if (process.env.API_URL && process.env.API_URL !== 'http://localhost:3000') {
    return `${baseUrl}/api/line${endpoint}`;
  }
  // Localhost: use /line prefix (routes mounted at /line)
  return `${baseUrl}/line${endpoint}`;
};

const LINE_REDIRECT_URI = getRedirectUri('/callback');

// Check if LINE is configured
export function isLineConfigured(): boolean {
  return !!(
    LINE_LOGIN_CHANNEL_ID &&
    LINE_LOGIN_CHANNEL_SECRET &&
    LINE_MESSAGING_CHANNEL_ID &&
    LINE_MESSAGING_CHANNEL_SECRET &&
    LINE_MESSAGING_ACCESS_TOKEN
  );
}

/**
 * Get LINE OAuth URL for login (customer login)
 */
export function getLineAuthUrl(state?: string): string | null {
  if (!isLineConfigured()) {
    console.warn('LINE Login not configured - LINE_LOGIN_CHANNEL_ID missing');
    return null;
  }

  const stateParam = state || Math.random().toString(36).substring(7);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_LOGIN_CHANNEL_ID!,
    redirect_uri: LINE_REDIRECT_URI,
    state: stateParam,
    scope: 'profile openid email',
  });

  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

/**
 * Get LINE OAuth URL for shop owners (LINE Messaging API)
 * Requests scopes: openid, profile, message.write, message.read
 */
export function getShopOwnerLineAuthUrl(shopId: string, state?: string): string | null {
  if (!LINE_MESSAGING_CHANNEL_ID || !LINE_MESSAGING_CHANNEL_SECRET) {
    console.warn('LINE Messaging API not configured - LINE_MESSAGING_CHANNEL_ID missing');
    return null;
  }

  const stateParam = state || `${shopId}_${Math.random().toString(36).substring(7)}`;
  const redirectUri = getRedirectUri('/shop-callback');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_MESSAGING_CHANNEL_ID,
    redirect_uri: redirectUri,
    state: stateParam,
    scope: 'openid profile message.write message.read',
  });

  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

/**
 * Handle LINE OAuth callback and get user info (customer login)
 */
export async function handleLineCallback(code: string): Promise<any> {
  if (!isLineConfigured()) {
    throw new Error('LINE not configured');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINE_REDIRECT_URI,
        client_id: LINE_LOGIN_CHANNEL_ID!,
        client_secret: LINE_LOGIN_CHANNEL_SECRET!,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json() as any;
    const accessToken = tokenData.access_token;

    // Get user profile
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to get user profile');
    }

    const profile = await profileResponse.json() as any;

    return {
      lineUserId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      email: tokenData.id_token ? await getEmailFromIdToken(tokenData.id_token) : null,
    };
  } catch (error) {
    console.error('Error handling LINE callback:', error);
    throw error;
  }
}

/**
 * Handle LINE OAuth callback for shop owners
 * Returns access token and destination ID (from webhook configuration)
 */
export async function handleShopOwnerLineCallback(code: string, shopId: string): Promise<{
  accessToken: string;
  destinationId: string | null;
  channelId: string | null;
}> {
  if (!LINE_MESSAGING_CHANNEL_ID || !LINE_MESSAGING_CHANNEL_SECRET) {
    throw new Error('LINE Messaging API not configured');
  }

  try {
    const redirectUri = getRedirectUri('/shop-callback');
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: LINE_MESSAGING_CHANNEL_ID,
        client_secret: LINE_MESSAGING_CHANNEL_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('LINE OAuth token error:', errorText);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json() as any;
    const accessToken = tokenData.access_token;

    // Get channel info to extract destination ID
    // Note: Destination ID is typically set in LINE Developers Console webhook configuration
    // For now, we'll need the owner to provide it, or we can get it from webhook verification
    // The destination ID is usually the channel ID for Messaging API
    const destinationId = LINE_MESSAGING_CHANNEL_ID; // This is a placeholder - actual destination ID comes from webhook config

    return {
      accessToken,
      destinationId,
      channelId: LINE_MESSAGING_CHANNEL_ID,
    };
  } catch (error) {
    console.error('Error handling shop owner LINE callback:', error);
    throw error;
  }
}

/**
 * Get email from LINE ID token
 */
async function getEmailFromIdToken(idToken: string): Promise<string | null> {
  try {
    // In production, verify the ID token signature
    // For now, decode the JWT payload
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    return payload.email || null;
  } catch (error) {
    console.error('Error decoding ID token:', error);
    return null;
  }
}

/**
 * Get LINE Messaging API client for a shop
 */
export function getLineMessagingClient(shopId: string): Client | null {
  if (!isLineConfigured()) {
    return null;
  }

  // In production, get channel access token from shop record
  // For now, use the global access token
  return new Client({
    channelAccessToken: LINE_MESSAGING_ACCESS_TOKEN!,
  });
}

/**
 * Send LINE message to a user
 */
export async function sendLineMessage(
  userId: string,
  message: string,
  shopId?: string
): Promise<boolean> {
  if (!isLineConfigured()) {
    console.warn('LINE Messaging not configured');
    return false;
  }

  try {
    const client = getLineMessagingClient(shopId || '');
    if (!client) {
      return false;
    }

    await client.pushMessage(userId, {
      type: 'text',
      text: message,
    });

    return true;
  } catch (error) {
    console.error('Error sending LINE message:', error);
    return false;
  }
}

/**
 * Send booking confirmation via LINE
 */
export async function sendBookingConfirmation(
  customerId: string,
  bookingData: {
    shopName: string;
    serviceName: string;
    date: string;
    time: string;
    bookingId: string;
  }
): Promise<boolean> {
  try {
    // Get LINE user ID for customer
    const { data: mapping } = await dbClient
      .from('line_user_mappings')
      .select('line_user_id')
      .eq('customer_id', customerId)
      .single();

    if (!mapping) {
      return false; // Customer doesn't have LINE connected
    }

    const message = `✅ 予約が確定しました！\n\n店舗: ${bookingData.shopName}\nサービス: ${bookingData.serviceName}\n日時: ${bookingData.date} ${bookingData.time}\n\n予約ID: ${bookingData.bookingId}\n\n変更やキャンセルはチャットでお知らせください。`;

    return await sendLineMessage(mapping.line_user_id, message);
  } catch (error) {
    console.error('Error sending booking confirmation via LINE:', error);
    return false;
  }
}

/**
 * Send booking reminder (24h before)
 */
export async function sendBookingReminder(
  customerId: string,
  bookingData: {
    shopName: string;
    serviceName: string;
    date: string;
    time: string;
  }
): Promise<boolean> {
  try {
    const { data: mapping } = await dbClient
      .from('line_user_mappings')
      .select('line_user_id')
      .eq('customer_id', customerId)
      .single();

    if (!mapping) {
      return false;
    }

    const message = `📅 予約リマインダー\n\n明日の予約をお忘れなく！\n\n店舗: ${bookingData.shopName}\nサービス: ${bookingData.serviceName}\n日時: ${bookingData.date} ${bookingData.time}`;

    return await sendLineMessage(mapping.line_user_id, message);
  } catch (error) {
    console.error('Error sending booking reminder via LINE:', error);
    return false;
  }
}

/**
 * Send booking update (cancellation/reschedule)
 */
export async function sendBookingUpdate(
  customerId: string,
  bookingData: {
    shopName: string;
    updateType: 'cancelled' | 'rescheduled';
    oldDate?: string;
    oldTime?: string;
    newDate?: string;
    newTime?: string;
  }
): Promise<boolean> {
  try {
    const { data: mapping } = await dbClient
      .from('line_user_mappings')
      .select('line_user_id')
      .eq('customer_id', customerId)
      .single();

    if (!mapping) {
      return false;
    }

    let message = '';
    if (bookingData.updateType === 'cancelled') {
      message = `❌ 予約がキャンセルされました\n\n店舗: ${bookingData.shopName}\n\nまたのご利用をお待ちしております。`;
    } else {
      message = `🔄 予約が変更されました\n\n店舗: ${bookingData.shopName}\n\n新しい日時: ${bookingData.newDate} ${bookingData.newTime}`;
    }

    return await sendLineMessage(mapping.line_user_id, message);
  } catch (error) {
    console.error('Error sending booking update via LINE:', error);
    return false;
  }
}

/**
 * Generate LINE share URL for a shop
 */
export function getLineShareUrl(shopId: string, shopName: string): string {
  const url = `${FRONTEND_URL}/shops/${shopId}`;
  const text = encodeURIComponent(`${shopName} - 予約はこちらから`);
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${text}`;
}


// apps/api/src/services/googleCalendarService.ts
// Google Calendar integration service for AI to create/update/delete events

import { google } from 'googleapis';
import { supabaseAdmin } from '../lib/supabase';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/callback';

/**
 * Get OAuth2 client for Google Calendar
 */
function getOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Get stored refresh token for a user
 */
async function getRefreshToken(userId: string): Promise<string | null> {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return null;
    }

    const { data, error } = await supabaseAdmin
      .from('user_google_tokens')
      .select('refresh_token')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.refresh_token;
  } catch (error) {
    console.error('Error fetching refresh token:', error);
    return null;
  }
}

/**
 * Get authenticated calendar client for a user
 */
async function getCalendarClient(userId: string) {
  const refreshToken = await getRefreshToken(userId);
  
  if (!refreshToken) {
    throw new Error('User has not authorized Google Calendar access');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // Refresh access token if needed
  const { credentials } = await oauth2Client.refreshAccessToken();
  oauth2Client.setCredentials(credentials);

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  userId: string,
  eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    location?: string;
    attendees?: Array<{ email: string }>;
  }
) {
  try {
    const calendar = await getCalendarClient(userId);

    const event = {
      summary: eventData.summary,
      description: eventData.description || '',
      start: {
        dateTime: eventData.start.dateTime,
        timeZone: eventData.start.timeZone || 'Asia/Tokyo',
      },
      end: {
        dateTime: eventData.end.dateTime,
        timeZone: eventData.end.timeZone || 'Asia/Tokyo',
      },
      location: eventData.location,
      attendees: eventData.attendees,
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return {
      success: true,
      eventId: response.data.id,
      event: response.data,
    };
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return {
      success: false,
      error: error.message || 'Failed to create calendar event',
    };
  }
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  eventData: {
    summary?: string;
    description?: string;
    start?: { dateTime: string; timeZone?: string };
    end?: { dateTime: string; timeZone?: string };
    location?: string;
  }
) {
  try {
    const calendar = await getCalendarClient(userId);

    // Get existing event
    const existingEvent = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });

    const updatedEvent = {
      ...existingEvent.data,
      summary: eventData.summary || existingEvent.data.summary,
      description: eventData.description !== undefined ? eventData.description : existingEvent.data.description,
      start: eventData.start ? {
        dateTime: eventData.start.dateTime,
        timeZone: eventData.start.timeZone || 'Asia/Tokyo',
      } : existingEvent.data.start,
      end: eventData.end ? {
        dateTime: eventData.end.dateTime,
        timeZone: eventData.end.timeZone || 'Asia/Tokyo',
      } : existingEvent.data.end,
      location: eventData.location !== undefined ? eventData.location : existingEvent.data.location,
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: updatedEvent,
    });

    return {
      success: true,
      eventId: response.data.id,
      event: response.data,
    };
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    return {
      success: false,
      error: error.message || 'Failed to update calendar event',
    };
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(userId: string, eventId: string) {
  try {
    const calendar = await getCalendarClient(userId);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete calendar event',
    };
  }
}

/**
 * Get authorization URL for Google Calendar OAuth
 */
export function getAuthorizationUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId, // Pass user ID in state for callback
    prompt: 'consent', // Force consent to get refresh token
  });

  return url;
}

/**
 * Exchange authorization code for tokens and store refresh token
 */
export async function handleOAuthCallback(
  code: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return {
        success: false,
        error: 'No refresh token received. Please authorize again with consent.',
      };
    }

    // Store refresh token in database
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return {
        success: false,
        error: 'Database not configured. SUPABASE_SERVICE_ROLE_KEY is required.',
      };
    }

    const { error } = await supabaseAdmin
      .from('user_google_tokens')
      .upsert({
        user_id: userId,
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error storing Google tokens:', error);
      return {
        success: false,
        error: 'Failed to store authorization tokens',
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error handling OAuth callback:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete authorization',
    };
  }
}


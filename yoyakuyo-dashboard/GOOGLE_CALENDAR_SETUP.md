# Google Calendar Integration Setup Guide

## Quick Setup Steps

### 1. Get Google API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google Calendar API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Configure OAuth Consent Screen:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (unless you have Google Workspace)
   - Fill required fields:
     - App name: "Bookyo"
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Add test users (your email) if in testing mode
   - Save and continue
5. Create OAuth Client ID:
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "Bookyo Calendar Integration"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/calendar/callback` (for development)
     - `https://yourdomain.com/api/calendar/callback` (for production)
   - Click "Create"
   - **Copy the Client ID and Client Secret**

### 2. Add to Environment Variables

Add these to `apps/api/.env`:

```env
# Google Calendar OAuth
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback

# Frontend URL (for OAuth callback redirect)
FRONTEND_URL=http://localhost:3001
```

### 3. Run Database Migration

The migration file `supabase/migrations/20250120000000_add_google_calendar_tokens.sql` needs to be applied to create the `user_google_tokens` table.

Run:
```bash
npm run migrate:auto
```

Or manually apply the migration in Supabase Dashboard.

### 4. Restart API Server

After adding the environment variables, restart your API server:

```bash
cd apps/api
npm run dev
```

## How It Works

1. **Owner connects Google Calendar:**
   - Frontend calls `GET /api/calendar/auth-url` with user ID
   - Returns Google OAuth authorization URL
   - Owner authorizes access
   - Google redirects to `/api/calendar/callback`
   - System stores refresh token in database

2. **AI creates calendar events:**
   - When AI confirms a booking, it can call calendar functions
   - System uses stored refresh token to create events
   - Events appear in owner's Google Calendar

## API Endpoints

- `GET /api/calendar/auth-url` - Get OAuth authorization URL (requires `x-user-id` header)
- `GET /api/calendar/callback` - OAuth callback handler
- `POST /api/calendar/events` - Create calendar event (requires `x-user-id` header)
- `PATCH /api/calendar/events/:eventId` - Update calendar event
- `DELETE /api/calendar/events/:eventId` - Delete calendar event

## Testing

1. Start your API server
2. Get authorization URL: `GET http://localhost:3000/api/calendar/auth-url` with `x-user-id` header
3. Visit the returned URL in browser
4. Authorize access
5. You'll be redirected back with success message

## Troubleshooting

- **"Google OAuth credentials not configured"**: Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- **"No refresh token received"**: Make sure OAuth consent screen has `prompt: 'consent'` (already set in code)
- **Redirect URI mismatch**: Ensure the redirect URI in Google Console exactly matches `GOOGLE_REDIRECT_URI` in `.env`
- **"User has not authorized Google Calendar access"**: User needs to complete OAuth flow first


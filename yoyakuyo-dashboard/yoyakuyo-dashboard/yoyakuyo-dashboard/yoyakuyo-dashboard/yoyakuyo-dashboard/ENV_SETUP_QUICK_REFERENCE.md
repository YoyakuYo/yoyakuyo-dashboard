# Environment Variables Setup - Quick Reference

## Where to Add Google Calendar Keys

Add these variables to **`apps/api/.env`**:

```env
# Google Calendar OAuth (REQUIRED for calendar integration)
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback

# Frontend URL (for OAuth callback redirect)
FRONTEND_URL=http://localhost:3001
```

## Complete API .env Template

Your `apps/api/.env` should include:

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server
PORT=3000

# Google Calendar OAuth (NEW - Add these)
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
FRONTEND_URL=http://localhost:3001

# OpenAI (if using AI features)
OPENAI_API_KEY=your_openai_api_key_optional
```

## After Adding Keys

1. **Restart your API server:**
   ```bash
   cd apps/api
   npm run dev
   ```

2. **Run the database migration:**
   ```bash
   npm run migrate:auto
   ```

3. **Test the integration:**
   - Visit your dashboard
   - Try connecting Google Calendar
   - Check that OAuth flow works

## Need Help Getting Keys?

See `GOOGLE_CALENDAR_SETUP.md` for detailed step-by-step instructions on getting Google API credentials.


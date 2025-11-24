# Vercel Environment Variables Configuration

## Required Environment Variables for Production

### Dashboard (Next.js) - Public Variables
These variables are exposed to the browser and must be prefixed with `NEXT_PUBLIC_`:

```
NEXT_PUBLIC_API_URL=https://yoyakuyo-api.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### API (Express) - Server Variables
These variables are server-only and should NOT be prefixed with `NEXT_PUBLIC_`:

#### Supabase (Required)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

#### OpenAI (Optional - for AI features)
```
OPENAI_API_KEY=sk-...
```

#### LINE Integration (Required for LINE features)
```
LINE_LOGIN_CHANNEL_ID=2008541897
LINE_LOGIN_CHANNEL_SECRET=your-line-login-secret
LINE_MESSAGING_CHANNEL_ID=2008541813
LINE_MESSAGING_CHANNEL_SECRET=your-line-messaging-secret
LINE_MESSAGING_ACCESS_TOKEN=your-line-access-token
LINE_REDIRECT_URI=https://yoyakuyo.vercel.app/api/line/callback
```

#### Google Calendar (Optional - for calendar integration)
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yoyakuyo.vercel.app/api/calendar/callback
```

#### Web Push (Optional - for push notifications)
```
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com
```

#### Other
```
FRONTEND_URL=https://yoyakuyo.vercel.app
API_URL=https://yoyakuyo-api.vercel.app
NODE_ENV=production
```

## How to Add in Vercel Dashboard

1. Go to your Vercel project settings
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable above
4. Select **Production**, **Preview**, and **Development** as needed
5. Click **Save**

## Important Notes

- **NEXT_PUBLIC_*** variables are exposed to the browser - never put secrets here
- **Server-only** variables (without NEXT_PUBLIC_) are secure and not exposed
- Update `LINE_REDIRECT_URI` and `GOOGLE_REDIRECT_URI` to match your Vercel domain
- Update `FRONTEND_URL` and `API_URL` to match your deployed URLs


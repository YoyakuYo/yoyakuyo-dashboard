# Vercel Deployment Plan for Yoyaku Yo

## Project Structure
- **Monorepo**: npm workspaces
- **Dashboard**: Next.js app at `apps/dashboard` (port 3001)
- **API**: Express.js app at `apps/api` (port 3000)

## Deployment Strategy

### Option 1: Single Vercel Project (Recommended)
- Deploy dashboard as main Next.js app
- Use Next.js API proxy routes to forward `/api/*` requests to external API
- Deploy API separately as Vercel serverless functions OR external service

### Option 2: Two Vercel Projects
- Project 1: Dashboard (Next.js)
- Project 2: API (Express as serverless functions)

## Environment Variables Required

### Dashboard (Next.js)
- `NEXT_PUBLIC_API_URL` - API base URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### API (Express)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key (optional)
- `LINE_LOGIN_CHANNEL_ID` - LINE Login channel ID
- `LINE_LOGIN_CHANNEL_SECRET` - LINE Login channel secret
- `LINE_MESSAGING_CHANNEL_ID` - LINE Messaging API channel ID
- `LINE_MESSAGING_CHANNEL_SECRET` - LINE Messaging API channel secret
- `LINE_MESSAGING_ACCESS_TOKEN` - LINE Messaging API access token
- `LINE_REDIRECT_URI` - LINE OAuth redirect URI
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional)
- `GOOGLE_REDIRECT_URI` - Google OAuth redirect URI (optional)
- `FRONTEND_URL` - Frontend URL for OAuth callbacks
- `API_URL` - API base URL (for self-referencing)
- `VAPID_PUBLIC_KEY` - Web Push VAPID public key (optional)
- `VAPID_PRIVATE_KEY` - Web Push VAPID private key (optional)
- `VAPID_SUBJECT` - Web Push VAPID subject (optional)

## DNS Configuration
- Domain: `yoyakuyo.jp`
- CNAME record: Point to Vercel deployment
- A record: Not needed (Vercel uses CNAME)


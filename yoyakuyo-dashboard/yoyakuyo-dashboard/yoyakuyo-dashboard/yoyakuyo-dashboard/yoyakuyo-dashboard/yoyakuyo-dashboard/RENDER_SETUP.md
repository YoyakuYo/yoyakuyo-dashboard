# Quick Render.com Setup Guide

## Step 1: Create Render Service

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub: `YoyakuYo/Yoyaku-Yo`
4. Configure:
   - **Name**: `yoyaku-yo-api`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Environment**: `Node`
   - **Build Command**: `cd apps/api && npm install && npm run build`
   - **Start Command**: `cd apps/api && npm start`
   - **Plan**: Starter (free)

## Step 2: Environment Variables

Add these in Render Dashboard → Environment:

```
NODE_ENV=production
PORT=10000
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=https://your-vercel-app.vercel.app
AUTO_KILL_PORT_CONFLICTS=false
```

(Add optional keys: OPENAI_API_KEY, LINE_MESSAGING_ACCESS_TOKEN, etc.)

## Step 3: Deploy

Click "Create Web Service" and wait for deployment.

Your backend URL will be: `https://yoyaku-yo-api.onrender.com`

## Step 4: Update Frontend

In Vercel, set:
```
NEXT_PUBLIC_API_URL=https://yoyaku-yo-api.onrender.com
```

Then update Render's `FRONTEND_URL` to your Vercel URL.


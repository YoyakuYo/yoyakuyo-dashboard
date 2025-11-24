# Yoyaku Yo - Full Stack Deployment Guide

This guide explains how to deploy the Yoyaku Yo application with separate backend and frontend deployments.

## Architecture

- **Backend**: Express.js API server deployed on Render.com
- **Frontend**: Next.js dashboard deployed on Vercel

## Prerequisites

1. GitHub account with repository: `YoyakuYo/Yoyaku-Yo`
2. Render.com account (free tier available)
3. Vercel account (free tier available)
4. Supabase project with database

## Step 1: Deploy Backend to Render.com

### 1.1 Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select repository: `YoyakuYo/Yoyaku-Yo`
5. Configure the service:
   - **Name**: `yoyaku-yo-api`
   - **Region**: Oregon (or closest to your users)
   - **Branch**: `main`
   - **Root Directory**: Leave empty (monorepo root)
   - **Environment**: `Node`
   - **Build Command**: `cd apps/api && npm install && npm run build`
   - **Start Command**: `cd apps/api && npm start`
   - **Plan**: Starter (free tier)

### 1.2 Set Environment Variables in Render

Go to your Render service → Environment → Add Environment Variables:

```
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key (optional)
LINE_MESSAGING_ACCESS_TOKEN=your-line-token (optional)
LINE_CHANNEL_SECRET=your-line-secret (optional)
GOOGLE_CLIENT_ID=your-google-client-id (optional)
GOOGLE_CLIENT_SECRET=your-google-client-secret (optional)
FRONTEND_URL=https://your-vercel-app.vercel.app
AUTO_KILL_PORT_CONFLICTS=false
```

### 1.3 Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build the TypeScript code
   - Start the Express server
3. Wait for deployment to complete
4. Your backend URL will be: `https://yoyaku-yo-api.onrender.com`

**Note**: Render free tier services spin down after 15 minutes of inactivity. The first request after spin-down may take 30-60 seconds.

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import Git Repository: `YoyakuYo/Yoyaku-Yo`
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/dashboard`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### 2.2 Set Environment Variables in Vercel

Go to Project Settings → Environment Variables → Add:

**For Production, Preview, and Development:**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://yoyaku-yo-api.onrender.com
NODE_ENV=production
```

**Important**: 
- Do NOT add `SUPABASE_SERVICE_ROLE_KEY` to Vercel (frontend should never have this)
- Replace `https://yoyaku-yo-api.onrender.com` with your actual Render backend URL

### 2.3 Deploy

1. Click "Deploy"
2. Vercel will automatically:
   - Build the Next.js app
   - Deploy to production
3. Your frontend URL will be: `https://your-app.vercel.app`

## Step 3: Update Backend with Frontend URL

1. Go back to Render Dashboard → Your API Service → Environment
2. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Render will automatically redeploy

## Step 4: Verify Deployment

### Test Backend
```bash
curl https://yoyaku-yo-api.onrender.com/api/shops
```

Should return JSON with shops data.

### Test Frontend
1. Visit your Vercel URL
2. Try logging in as an owner
3. Browse shops
4. Create a booking

## Troubleshooting

### Backend Issues

**Problem**: Backend returns 500 errors
- **Solution**: Check Render logs for environment variable issues
- **Solution**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly

**Problem**: Backend times out on first request
- **Solution**: This is normal on Render free tier (cold start). Wait 30-60 seconds.

**Problem**: CORS errors
- **Solution**: CORS is configured in `apps/api/src/index.ts`. Verify backend URL is correct.

### Frontend Issues

**Problem**: "API request failed"
- **Solution**: Check `NEXT_PUBLIC_API_URL` in Vercel environment variables
- **Solution**: Verify backend is running (check Render dashboard)

**Problem**: "Invalid login credentials"
- **Solution**: Verify Supabase environment variables are correct
- **Solution**: Check Supabase Auth settings (email confirmation, etc.)

**Problem**: TypeScript build errors
- **Solution**: CORS types should only be in `apps/api`, not `apps/dashboard`
- **Solution**: Run `npm run build` locally to catch errors before deploying

## Environment Variables Summary

### Backend (Render.com)
- `SUPABASE_URL` ✅
- `SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (Backend only!)
- `OPENAI_API_KEY` (optional)
- `LINE_MESSAGING_ACCESS_TOKEN` (optional)
- `LINE_CHANNEL_SECRET` (optional)
- `GOOGLE_CLIENT_ID` (optional)
- `GOOGLE_CLIENT_SECRET` (optional)
- `FRONTEND_URL` ✅

### Frontend (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `NEXT_PUBLIC_API_URL` ✅
- ❌ **DO NOT** add `SUPABASE_SERVICE_ROLE_KEY` to frontend

## Automatic Deployments

Both Render and Vercel support automatic deployments:
- **Render**: Automatically deploys on push to `main` branch
- **Vercel**: Automatically deploys on push to `main` branch (if connected)

## Manual Deployment

If automatic deployment fails:

### Render
1. Go to Render Dashboard → Your Service
2. Click "Manual Deploy" → "Deploy latest commit"

### Vercel
1. Go to Vercel Dashboard → Your Project
2. Go to "Deployments" tab
3. Click "Redeploy" on latest deployment

## Support

For issues:
1. Check deployment logs in Render/Vercel dashboards
2. Verify all environment variables are set correctly
3. Test API endpoints directly with `curl` or Postman
4. Check Supabase dashboard for database connection issues


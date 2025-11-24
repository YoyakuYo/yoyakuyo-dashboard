# Vercel Deployment Guide for Yoyaku Yo

## ✅ Pre-Deployment Checklist

### Files Created/Modified
1. **`vercel.json`** - Root Vercel configuration for dashboard deployment
2. **`apps/dashboard/app/api-proxy/[...path]/route.ts`** - API proxy route for Next.js
3. **`VERCEL_ENV_VARS.md`** - Complete environment variables list
4. **`VERCEL_DEPLOYMENT_PLAN.md`** - Deployment strategy documentation

### Build Status
- ✅ Dashboard builds successfully
- ✅ API proxy route configured
- ✅ TypeScript compilation passes

## 🚀 Deployment Steps

### Step 1: Login to Vercel

```bash
npx vercel login
```

Follow the prompts to authenticate with Vercel (browser will open).

### Step 2: Link Project

```bash
npx vercel link
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → `yoyakuyo`
- **Directory?** → `./apps/dashboard` (or leave as `.` if using root vercel.json)
- **Override settings?** → No

### Step 3: Add Environment Variables

Before deploying, add all environment variables in Vercel Dashboard:

1. Go to your project: https://vercel.com/your-username/yoyakuyo/settings/environment-variables
2. Add all variables from `VERCEL_ENV_VARS.md`
3. Make sure to select **Production**, **Preview**, and **Development** environments

### Step 4: Deploy to Preview

```bash
npx vercel
```

This creates a preview deployment. Test it thoroughly.

### Step 5: Deploy to Production

```bash
npx vercel --prod
```

## 📋 Post-Deployment

### 1. Update API URLs

After deployment, update these environment variables with your actual Vercel URLs:

- `NEXT_PUBLIC_API_URL` → Your API deployment URL
- `FRONTEND_URL` → Your dashboard deployment URL
- `LINE_REDIRECT_URI` → `https://your-domain.vercel.app/api/line/callback`
- `GOOGLE_REDIRECT_URI` → `https://your-domain.vercel.app/api/calendar/callback`

### 2. Deploy API Separately

The API needs to be deployed separately. Options:

**Option A: Deploy API as separate Vercel project**
1. Create new Vercel project for API
2. Point to `apps/api` directory
3. Configure as Node.js serverless functions
4. Update `NEXT_PUBLIC_API_URL` to point to API deployment

**Option B: Use API proxy (current setup)**
- API proxy routes requests to external API
- Set `NEXT_PUBLIC_API_URL` to your API server URL
- API can run on separate service (Railway, Render, etc.)

### 3. Configure Custom Domain

1. Go to Vercel project settings → Domains
2. Add `yoyakuyo.jp`
3. Follow DNS configuration instructions below

## 🌐 DNS Configuration for yoyakuyo.jp

### In Squarespace DNS Settings:

Add a **CNAME record**:
- **Type**: CNAME
- **Host**: `@` (or leave blank for root domain)
- **Points to**: `cname.vercel-dns.com` (Vercel will provide exact value)
- **TTL**: 3600 (or default)

**OR** if CNAME not supported for root domain:

Add **A records** (Vercel will provide IPs):
- **Type**: A
- **Host**: `@`
- **Points to**: `76.76.21.21` (Vercel's IP - check Vercel dashboard for exact IPs)
- **TTL**: 3600

**Note**: Vercel will provide the exact DNS values after you add the domain in their dashboard.

## 🔍 Verification

After deployment, verify:

1. ✅ Dashboard loads at Vercel URL
2. ✅ Public shop pages work
3. ✅ API proxy routes work (`/api/*`)
4. ✅ Authentication works
5. ✅ Database connections work
6. ✅ LINE integration works (if configured)

## 📝 Important Notes

- **API Deployment**: The Express API needs separate deployment. Current setup uses proxy.
- **Environment Variables**: All must be added in Vercel dashboard before production deployment.
- **Build Time**: First deployment may take 5-10 minutes.
- **Domain Setup**: DNS changes can take up to 48 hours to propagate.

## 🆘 Troubleshooting

### Build Fails
- Check environment variables are set
- Verify `vercel.json` configuration
- Check build logs in Vercel dashboard

### API Proxy Not Working
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check API server is running and accessible
- Review API proxy route logs

### Domain Not Working
- Verify DNS records are correct
- Check domain is added in Vercel dashboard
- Wait for DNS propagation (up to 48 hours)


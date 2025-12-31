# Manual API Server Start Guide

## Prerequisites
- Node.js installed
- All dependencies installed (`npm install`)

## Step-by-Step Instructions

### 1. Navigate to API Directory
```bash
cd apps/api
```

### 2. Install Dependencies (if not already done)
```bash
npm install
```

### 3. Build TypeScript to JavaScript
```bash
npm run build
```
This compiles `src/` TypeScript files to `dist/` JavaScript files.

### 4. Check for Port Conflicts
The API runs on port 3000 by default. If port 3000 is in use:

**Option A: Kill the process using port 3000**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Option B: Use a different port**
```bash
$env:PORT=3002; npm start
```

### 5. Start the API Server

**For Production (uses compiled JavaScript):**
```bash
npm start
```

**For Development (auto-reload on changes):**
```bash
npm run dev
```

### 6. Verify Server is Running
You should see:
```
✅ Yoyaku Yo API running on port 3000
   http://localhost:3000
   Webhook endpoint: http://localhost:3000/api/line/webhook
   Shop callback: http://localhost:3000/api/line/shop-callback
```

### 7. Test the API
Open your browser or use curl:
```bash
curl http://localhost:3000
```
Should return: `Yoyaku Yo API running!`

## Troubleshooting

### Error: "Port 3000 is already in use"
- Kill the process: `taskkill /PID <PID> /F`
- Or use different port: `$env:PORT=3002; npm start`

### Error: "Cannot find module"
- Run `npm install` to install dependencies
- Run `npm run build` to compile TypeScript

### Error: "TypeScript compilation errors"
- Check `apps/api/src/routes/customers.ts` for syntax errors
- Fix any TypeScript errors before building

### Error: "Module not found"
- Ensure all dependencies are installed: `npm install`
- Check that `dist/` folder exists after building

## Environment Variables
Make sure you have a `.env` file in `apps/api/` with required variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (optional, defaults to 3000)
- Other API keys as needed

## Quick Start (All-in-One)
```bash
cd apps/api
npm install
npm run build
npm start
```

## For Render.com Deployment
Render should automatically:
1. Install dependencies (`npm install`)
2. Build the project (`npm run build`)
3. Start the server (`npm start`)

If it's not starting, check Render logs for errors.


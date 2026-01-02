# How to Access LINE Features - Complete Guide

This guide explains all the ways users can access LINE features in your Yoyaku Yo application.

---

## 🎯 Overview

There are **3 main ways** users can access LINE features:

1. **LINE Bot** - Chat with AI assistant via LINE messaging
2. **LINE Mini App (LIFF)** - Full web app inside LINE
3. **LINE Login** - Sign in with LINE account

---

## 1️⃣ LINE Bot (AI Assistant)

### How Users Access It:

**Step 1: Add the Bot as Friend**
- Users need to add your LINE Official Account as a friend
- They can do this by:
  - Scanning a QR code
  - Searching for your LINE Official Account ID
  - Clicking a LINE link

**Step 2: Start Chatting**
- Once added, users can send messages to the bot
- The bot responds with AI assistance
- Users can:
  - Search for shops: "Find me a hair salon in Tokyo"
  - Book appointments: "Book me at [shop name] tomorrow at 2pm"
  - View bookings: "Show my bookings"
  - Ask questions: "What services do you have?"

### Bot Features:
- ✅ Shop search by category, location, name
- ✅ AI-powered natural language booking
- ✅ Booking confirmations
- ✅ View bookings
- ✅ Rich menu (persistent buttons at bottom)

### Access URL Format:
```
https://line.me/R/ti/p/@YOUR_LINE_OFFICIAL_ACCOUNT_ID
```

---

## 2️⃣ LINE Mini App (LIFF) - Full Web Experience

### How Users Access It:

**Option A: Direct LIFF URL**
```
https://liff.line.me/YOUR_LIFF_ID
```

**Option B: From LINE Bot**
- Users can click a button in the bot that opens the LIFF app
- Or use the rich menu buttons

**Option C: From Shop Pages**
- Shop owners can share LIFF links
- QR codes can link to LIFF app

### What Users Can Do in LIFF:
- ✅ Browse and search shops
- ✅ View shop details
- ✅ Book appointments (full booking form)
- ✅ View their bookings
- ✅ Chat with AI assistant
- ✅ Filter by category, prefecture, location

### LIFF App Routes:
- `/line-app` - Main search page
- `/line-app/shops/[id]` - Shop detail page
- `/line-app/book/[shopId]` - Booking form
- `/line-app/bookings` - My bookings
- `/line-app/chat` - AI chat assistant

### Your LIFF Details:
- **LIFF ID**: `2008541897-ysd899rb`
- **LIFF URL**: `https://liff.line.me/2008541897-ysd899rb`
- **Endpoint URL**: `https://yoyakuyo-dashboard.vercel.app/line-app`

---

## 3️⃣ LINE Login (OAuth)

### How Users Access It:

**Option A: LINE Login Button**
- Users click "Login with LINE" button on your website
- Redirects to LINE OAuth
- Returns to your app with LINE account linked

**Option B: Direct Login URL**
```
GET /api/line/login
```
This initiates the OAuth flow.

### What Happens:
1. User clicks "Login with LINE"
2. Redirected to LINE OAuth page
3. User authorizes your app
4. Redirected back to: `/api/line/login/callback`
5. LINE account is linked to customer profile
6. User is logged in

---

## 📱 For Shop Owners

### Generate LINE QR Code:

**In Owner Dashboard:**
1. Go to **My Shop** → **Overview** tab
2. Scroll to **LINE QR Code** section
3. QR code is automatically generated
4. Options:
   - **Copy LINE Link** - Copies deep link URL
   - **Download QR Code** - Downloads QR image

### QR Code Links To:
- LINE Official Account (if configured)
- Or LIFF app with shop context

---

## 🔗 Access Methods Summary

### Method 1: LINE Bot (Messaging)
```
1. Add LINE Official Account as friend
2. Send message: "Hello"
3. Bot responds with welcome message
4. Start chatting and booking
```

### Method 2: LINE Mini App (LIFF)
```
1. Open in LINE app: https://liff.line.me/2008541897-ysd899rb
2. Or click button in LINE bot
3. Full web experience opens
4. Browse, search, and book shops
```

### Method 3: LINE Login
```
1. Click "Login with LINE" on website
2. Authorize on LINE
3. Account linked automatically
4. Access all features
```

---

## 🎨 User Experience Flow

### New User Journey:

**Via LINE Bot:**
```
1. User adds bot as friend
2. Receives welcome message
3. Types: "Find me a beauty salon"
4. Bot shows shop carousel
5. User clicks shop → sees details
6. User clicks "Book" → booking flow
7. Confirmation sent via LINE
```

**Via LIFF App:**
```
1. User opens LIFF URL in LINE
2. Sees shop search interface
3. Filters by category/location
4. Clicks shop → detail page
5. Clicks "Book This Service"
6. Selects date/time
7. Confirms booking
8. Redirected to bookings page
```

---

## 🔧 Technical Details

### LINE Official Account ID
- Found in LINE Official Account Manager (not Developers Console)
- Format: `@xxxxx` (e.g., `@yoyakuyo`)
- Used for: Bot friend requests, QR codes that open directly in LINE app
- Set as: `NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_ID` environment variable
- QR Code URL format: `https://line.me/R/ti/p/@YOUR_ACCOUNT_ID`

### LIFF ID
- Your LIFF ID: `2008541897-ysd899rb`
- Found in: LINE Developers Console → LIFF tab
- Used for: Opening web app in LINE

### Webhook URL
- Backend endpoint: `https://yoyakuyo-api.onrender.com/api/line/webhook`
- Receives: Messages, postbacks, follow events
- Must be: HTTPS, publicly accessible

---

## 📋 Quick Reference

### For End Users:
- **Add Bot**: Search LINE Official Account or scan QR code
- **Use App**: Open `https://liff.line.me/2008541897-ysd899rb` in LINE
- **Login**: Click "Login with LINE" on website

### For Shop Owners:
- **Generate QR**: Go to My Shop → Overview → LINE QR Code
- **Share Link**: Copy LINE link and share with customers
- **Download QR**: Download QR code image for printing

### For Developers:
- **Bot Webhook**: `POST /api/line/webhook`
- **LIFF Endpoint**: `/line-app` routes
- **Login Flow**: `/api/line/login` → `/api/line/login/callback`

---

## 🚀 Getting Started

### To Test LINE Bot:
1. Add your LINE Official Account as friend
2. Send a test message
3. Bot should respond

### To Test LIFF App:
1. Open `https://liff.line.me/2008541897-ysd899rb` in LINE app
2. Should see shop search interface
3. Try searching and booking

### To Test LINE Login:
1. Go to your website
2. Click "Login with LINE" button
3. Complete OAuth flow
4. Should be logged in

---

## 📞 Support

If users have trouble accessing LINE features:
- Check LINE Official Account is active
- Verify LIFF app is published
- Ensure webhook URL is accessible
- Check environment variables are set

For setup help, see: `LINE_SETUP_GUIDE.md`


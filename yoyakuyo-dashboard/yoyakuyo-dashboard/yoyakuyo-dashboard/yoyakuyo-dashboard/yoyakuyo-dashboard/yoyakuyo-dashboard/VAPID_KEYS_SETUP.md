# VAPID Keys Setup for Push Notifications

## Where to Put VAPID Keys

The VAPID keys need to be added as **environment variables** in your backend API deployment.

### 1. **Local Development** (yoyakuyo-api)

Create a `.env` file in the `yoyakuyo-api/` directory:

```bash
# yoyakuyo-api/.env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@yoyaku-yo.com
```

**Note:** Add `.env` to `.gitignore` to keep keys secure.

### 2. **Production (Render.com)**

If you're using Render.com for API deployment:

1. Go to your Render Dashboard
2. Select your **yoyaku-yo-api** service
3. Go to **Environment** tab
4. Click **"Add Environment Variable"**
5. Add each variable:
   - `VAPID_PUBLIC_KEY` = your_public_key
   - `VAPID_PRIVATE_KEY` = your_private_key
   - `VAPID_SUBJECT` = mailto:admin@yoyaku-yo.com
6. Click **"Save Changes"**
7. **Redeploy** your service for changes to take effect

### 3. **Update render.yaml** (Optional)

You can also add them to `render.yaml` for version control (but keep actual keys in Render dashboard):

```yaml
envVars:
  - key: VAPID_PUBLIC_KEY
    sync: false  # Set to false, add actual value in Render dashboard
  - key: VAPID_PRIVATE_KEY
    sync: false
  - key: VAPID_SUBJECT
    value: mailto:admin@yoyaku-yo.com
```

## How to Generate VAPID Keys

If you don't have VAPID keys yet, you can generate them using Node.js:

```bash
# Install web-push globally
npm install -g web-push

# Generate keys
web-push generate-vapid-keys
```

This will output:
```
Public Key: <your-public-key>
Private Key: <your-private-key>
```

## Important Notes

1. **Never commit VAPID keys to Git** - Keep them in environment variables only
2. **VAPID_SUBJECT** should be a valid email address (mailto: format)
3. **Same keys for all environments** - You can use the same VAPID keys for dev and production
4. **Restart required** - After adding keys, restart/redeploy your API service

## Verification

After adding the keys, check the API logs. You should see:
```
[WebPush] ✅ VAPID keys configured
```

If you see:
```
[WebPush] ⚠️ VAPID keys not configured - Web Push will be disabled
```

Then the keys are not set correctly.


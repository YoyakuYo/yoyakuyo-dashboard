# How to Check Bounce Details in Resend

## Steps to Diagnose Bounce Issue

1. **Click on the bounced email in Resend dashboard**
   - Go to: https://resend.com/emails
   - Click on any bounced email
   - Look for "Bounce Reason" or "Error Message"

2. **Common Bounce Reasons:**

   **A. Domain Not Verified**
   - Error: "550 5.7.1 Domain not verified"
   - Fix: Verify domain in Resend dashboard

   **B. SPF Validation Failed**
   - Error: "550 5.7.1 SPF validation failed"
   - Fix: Add SPF record: `v=spf1 include:amazonses.com ~all`

   **C. DKIM Validation Failed**
   - Error: "550 5.7.1 DKIM validation failed"
   - Fix: Add DKIM record from Resend dashboard

   **D. Domain Reputation**
   - Error: "550 5.7.1 Message rejected due to domain policy"
   - Fix: Domain may be blacklisted, need to warm up domain

3. **Quick Fix Options:**

   **Option 1: Use Resend's Default Domain (Temporary)**
   - Change `EMAIL_FROM` to: `onboarding@resend.dev`
   - This is Resend's default domain (for testing only)
   - ⚠️ Not recommended for production

   **Option 2: Fix Domain Verification (Recommended)**
   - Go to Resend dashboard → Domains
   - Click on `yoyakuyo.jp`
   - Check verification status
   - Add missing DNS records in Squarespace
   - Wait for verification (can take up to 48 hours)

4. **Verify DNS Records in Squarespace:**
   - SPF: `v=spf1 include:amazonses.com ~all`
   - DKIM: Get from Resend dashboard
   - MX: `feedback-smtp.ap-northeast-1.amazonses.com`

## What to Do Now

1. **Click on a bounced email in Resend dashboard**
2. **Copy the bounce reason/error message**
3. **Share it with me so I can provide the exact fix**

The bounce reason will tell us exactly what's wrong!


# Fix Email Bounce Issue

## Problem
Emails are being sent but bouncing (rejected by recipient email server).

## Root Cause
Gmail is rejecting emails from `booking@yoyakuyo.jp` because:
1. Domain not properly verified in Resend
2. SPF/DKIM records not correctly configured
3. Domain reputation issues

## Solution Steps

### 1. Verify Domain in Resend Dashboard
- Go to: https://resend.com/domains
- Check if `yoyakuyo.jp` shows as "Verified"
- If not verified, you need to add DNS records

### 2. Check DNS Records
The following DNS records should be in Squarespace:
- **SPF Record**: `v=spf1 include:amazonses.com ~all`
- **DKIM Record**: `resend._domainkey` with the provided key
- **MX Record**: `feedback-smtp.ap-northeast-1.amazonses.com`

### 3. Verify EMAIL_FROM Configuration
- Should be: `booking@yoyakuyo.jp` (or another verified domain email)
- Must match the verified domain in Resend

### 4. Check Resend Bounce Details
- In Resend dashboard, click on the bounced email
- Check the bounce reason/message
- Common reasons:
  - "550 5.7.1 Message rejected due to domain policy"
  - "550 5.7.1 SPF validation failed"
  - "550 5.7.1 DKIM validation failed"

### 5. Temporary Workaround
If domain verification is the issue, you can:
- Use Resend's default domain temporarily (but this may have deliverability issues)
- Or fix DNS records properly

## Next Steps
1. Check Resend dashboard for bounce reason
2. Verify DNS records in Squarespace
3. Re-verify domain in Resend
4. Test with a different email address


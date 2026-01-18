# Diagnose Email Bounce Issue

## Your Configuration (Correct)
- **EMAIL_FROM**: `booking@yoyakuyo.jp` ✅
- **EMAIL_REPLY_TO**: `yoyakuyo100@gmail.com` ✅
- **Domain**: `yoyakuyo.jp` - Verified ✅

## Since It Worked Yesterday

This suggests:
1. **Gmail Temporary Block** - Gmail may have temporarily blocked your domain
2. **Rate Limiting** - Too many emails sent too quickly
3. **Email Address Suppression** - The email address may be on a suppression list
4. **Content Filtering** - Email content triggering spam filters

## Immediate Steps

### 1. Check Bounce Reason in Resend
- Go to: https://resend.com/emails
- Click on a bounced email
- Look for "Bounce Reason" or "Error Message"
- **Share the exact error message with me**

### 2. Check Suppression List
- Go to: https://resend.com/audience/suppressions
- Check if `yayakuyodemo@gmail.com` is on the list
- If yes, remove it

### 3. Check Email Volume
- Go to: https://resend.com/metrics
- Check if you've hit rate limits
- Free tier: 100 emails/day
- Check if you've exceeded limits

### 4. Test with Different Email
- Try sending to a different Gmail address
- See if the issue is specific to one address

## Common Bounce Reasons

1. **"550 5.7.1 Message rejected due to domain policy"**
   - Gmail blocking your domain
   - Fix: Wait 24-48 hours, or contact Gmail

2. **"550 5.7.1 Rate limit exceeded"**
   - Too many emails sent
   - Fix: Wait and reduce sending frequency

3. **"550 5.1.1 User unknown"**
   - Email address doesn't exist
   - Fix: Verify email address is correct

4. **"550 5.7.1 Suppressed recipient"**
   - Email on suppression list
   - Fix: Remove from suppression list

## What to Share

Please share:
1. **Exact bounce reason** from Resend dashboard
2. **Whether the email is on suppression list**
3. **How many emails you sent today** (check metrics)

This will help me provide the exact fix!


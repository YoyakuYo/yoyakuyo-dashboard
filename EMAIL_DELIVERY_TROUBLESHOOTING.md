# Email Delivery Troubleshooting Guide

## Issue: Emails are being sent (logs show success) but not received

### Symptoms
- API logs show: `✅ Email sent successfully to: [email]`
- But no email arrives in inbox

### Possible Causes

1. **Email in Spam Folder**
   - Check spam/junk folder
   - Mark as "Not Spam" if found
   - Add `booking@yoyakuyo.jp` to contacts

2. **Domain Not Verified**
   - Check Resend dashboard: https://resend.com/domains
   - Verify `yoyakuyo.jp` domain is verified
   - Check DNS records are correct

3. **Email Provider Blocking**
   - Gmail/Outlook may block unverified senders
   - Check email provider's security settings
   - Try a different email address to test

4. **Resend API Limits**
   - Check Resend dashboard for rate limits
   - Free tier has sending limits
   - Check if account is suspended

5. **Email Address Typo**
   - Verify email address in database
   - Check for typos in email field

### How to Verify

1. **Check Resend Dashboard**
   - Go to: https://resend.com/emails
   - Look for emails sent to your address
   - Check delivery status (delivered, bounced, failed)

2. **Check API Logs**
   - Look for `[Email] ✅ Email accepted by Resend API (email_id: ...)`
   - Use email_id to find email in Resend dashboard
   - Check delivery status in Resend

3. **Test Email Address**
   - Try sending to a different email (Gmail, Outlook, etc.)
   - See if problem is specific to one email provider

4. **Check Database**
   ```sql
   SELECT id, email, role, created_at 
   FROM customers 
   WHERE role = 'guest' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```
   - Verify email addresses are correct
   - Check for typos or invalid formats

### Quick Fixes

1. **Verify Domain in Resend**
   - Go to Resend dashboard → Domains
   - Ensure `yoyakuyo.jp` is verified
   - Re-verify if needed

2. **Check Environment Variables**
   - `RESEND_API_KEY`: Should be set
   - `EMAIL_FROM`: Should be `booking@yoyakuyo.jp` (or verified domain)
   - `EMAIL_REPLY_TO`: Optional, but should be valid email

3. **Test with Different Email**
   - Create a test booking with a different email
   - See if delivery works for other addresses

4. **Check Spam Folder**
   - Most common issue
   - Check all email folders (Inbox, Spam, Promotions, etc.)

### Resend Dashboard Links

- **Emails**: https://resend.com/emails
- **Domains**: https://resend.com/domains
- **API Keys**: https://resend.com/api-keys
- **Logs**: https://resend.com/logs

### Next Steps

1. Check Resend dashboard for delivery status
2. Verify domain is properly configured
3. Check spam folder
4. Test with different email address
5. Check Resend account limits/status


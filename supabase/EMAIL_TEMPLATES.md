# Custom auth email templates (platform branding)

Password reset (and other auth) emails are sent by Supabase. By default they can say "powered by Supabase". To send them **in your platform’s name** (e.g. Yoyakuyo), do the following.

---

## Production (hosted Supabase)

### 1. Edit the Reset Password email template

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** → your project.
2. Go to **Authentication** → **Email Templates**.
3. Select **Reset Password**.
4. Set **Subject** to: `Reset your password` (or your preferred subject).
5. Replace the **Message body** with the content of `supabase/templates/recovery.html` from this repo, or paste the HTML below (it uses `{{ .ConfirmationURL }}` and has no Supabase branding).

**Subject:** `Reset your password`

**Message body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 24px;">
    <h1 style="font-size: 1.5rem; margin: 0 0 8px 0;">Reset your password</h1>
    <p style="margin: 0; color: #666;">You requested a password reset for your account.</p>
  </div>
  <p>Click the link below to set a new password. This link will expire in 1 hour.</p>
  <p style="margin: 24px 0;">
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">Reset password</a>
  </p>
  <p style="font-size: 0.875rem; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
  <p style="font-size: 0.875rem; word-break: break-all;">{{ .ConfirmationURL }}</p>
  <p style="font-size: 0.875rem; color: #666;">If you didn't request this, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px 0;">
  <p style="font-size: 0.75rem; color: #999;">This email was sent by Yoyakuyo. Please do not reply to this message.</p>
</body>
</html>
```

6. Change **"Yoyakuyo"** in the last line to your platform name if different.
7. Click **Save**.

### 2. (Optional) Custom sender name

To have the email show your platform name as the sender (e.g. "Yoyakuyo" instead of "Supabase" or "noreply"):

1. In the Dashboard go to **Authentication** → **Providers** (or **Settings**).
2. If you use **custom SMTP** (recommended for production): set the **Sender name** / **From name** to your platform name (e.g. `Yoyakuyo`).
3. If you are still on **Supabase’s default mailer**: the "From" name is controlled by Supabase. For full control (sender name and no Supabase branding in the body), configure [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) and set your sender name there.

---

## Local development

The file `supabase/templates/recovery.html` is already wired in `supabase/config.toml` under `[auth.email.template.recovery]`. Local auth emails (e.g. via Inbucket/Mailpit) will use this template.

After changing the template or config, restart Supabase:

```bash
supabase stop && supabase start
```

---

## Template variables

Supabase supports these in the template:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Full link the user must click to reset password |
| `{{ .Email }}` | User’s email address |
| `{{ .SiteURL }}` | Your app’s site URL from Auth URL configuration |

Do **not** remove `{{ .ConfirmationURL }}` from the reset email; the flow depends on it.
